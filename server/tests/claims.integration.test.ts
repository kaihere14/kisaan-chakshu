import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { once } from "node:events";
import express from "express";
import { Redis } from "ioredis";
import { Queue, Worker } from "bullmq";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { getRedisConfig } from "../src/config/env.js";
import { buildDemoPolicies } from "../prisma/seed-data.js";
import { createClaimService } from "../src/claim/claim.service.js";
import { createClaimRouter } from "../src/claim/claim.route.js";
import { claimQueue, CLAIM_QUEUE_NAME, closeClaimQueue } from "../src/claim/claim.queue.js";
import { errorMiddleware } from "../src/middleware/error.middleware.js";
import { verifyInsuranceService } from "../src/insurance/insurance.service.js";
import { InsuranceVerificationReason as Reason, type InsuranceVerificationInput, type InsuranceVerificationResult } from "../src/insurance/insurance.types.js";
import type { ClaimJobData, ClaimResponse, ClaimSubmissionInput, ClaimUpload } from "../src/claim/claim.types.js";
import { createAuthService } from "../src/auth/auth.service.js";
import { hashPassword } from "../src/auth/password.js";

// Only run against explicitly supplied, migrated disposable database/Redis instances.
// No external ImageKit calls are made; its upload/deletion boundary is simulated.
const databaseUrl = process.env.CLAIM_TEST_DATABASE_URL;
const redisKeys = ["REDIS_HOST", "REDIS_PORT", "REDIS_PASSWORD", "REDIS_USERNAME", "REDIS_TLS"] as const;
const redisEnvironment = Object.fromEntries(redisKeys.map((key) => [key, process.env[`CLAIM_TEST_${key}`] ?? ""]));

test("claim API → PostgreSQL outbox → real BullMQ → insurance result", {
  skip: !databaseUrl || !redisEnvironment.REDIS_HOST || !redisEnvironment.REDIS_PORT, timeout: 60_000,
}, async (t) => {
  const previousRedis = Object.fromEntries(redisKeys.map((key) => [key, process.env[key]]));
  for (const key of redisKeys) process.env[key] = redisEnvironment[key];
  const redisConfig = getRedisConfig(redisEnvironment);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl! }) });
  const namespace = randomUUID();
  const account = await prisma.user.create({ data: {
    email: `${namespace}@example.invalid`, name: "Integration farmer", password_hash: await hashPassword("integration-passphrase"),
  } });
  const auth = createAuthService(prisma);
  const { token } = await auth.login({ email: account.email, password: "integration-passphrase" });
  const sample = buildDemoPolicies()[0]!;
  const policy = await prisma.insurancePolicy.create({ data: {
    ...sample, policy_number: `TEST-${namespace}`, application_number: `APP-${namespace}`,
  } });
  const input: ClaimSubmissionInput = {
    policy_number: policy.policy_number, owner_demo_id: policy.owner_demo_id, owner_name: policy.owner_name,
    plot_id: policy.plot_id, crop: policy.crop, season: policy.season, season_year: policy.season_year,
    peril: "flood", event_date: "2026-10-15",
  };
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9ioAAAAASUVORK5CYII=", "base64");
  const photo: ClaimUpload = { buffer: png, fileName: "damage.png", mimeType: "image/png" };
  let uploads = 0;
  let failUploadAt = -1;
  let failDelete = false;
  let duplicateFileId: string | undefined;
  const deleted: string[] = [];
  let override: ((value: InsuranceVerificationInput) => Promise<InsuranceVerificationResult>) | undefined;
  const service = createClaimService({ prisma,
    images: {
      async upload() {
        uploads++;
        if (uploads === failUploadAt) throw new Error("Simulated provider failure");
        return { fileId: duplicateFileId ?? `test-${namespace}-${uploads}`, url: `https://example.invalid/${namespace}/${uploads}.png` };
      },
      async delete(id) { if (failDelete) throw new Error("Simulated cleanup failure"); deleted.push(id); },
    },
    verify: (value) => override ? override(value) : verifyInsuranceService(value,
      (number) => prisma.insurancePolicy.findUnique({ where: { policy_number: number } })),
  });
  const app = express();
  app.use("/api/claims", createClaimRouter(service, auth));
  app.use(errorMiddleware);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api/claims`;
  const request = (path: string, options: RequestInit = {}) => fetch(path, {
    ...options, headers: { Cookie: `kc_session=${token}`, "X-Requested-With": "KisaanChakshu", ...options.headers },
  });
  const workerConnection = new Redis({ ...redisConfig, maxRetriesPerRequest: null });
  const worker = new Worker<ClaimJobData>(CLAIM_QUEUE_NAME,
    (job) => service.processClaim(job.data.claimId, job.attemptsMade + 1, job.opts.attempts ?? 3),
    { connection: workerConnection, concurrency: 2 });
  worker.on("error", () => {});
  const inspectionConnection = new Redis(redisConfig);
  const queue = new Queue<ClaimJobData>(CLAIM_QUEUE_NAME, { connection: inspectionConnection });
  const claimIds: string[] = [];
  const key = () => `${namespace}-${randomUUID()}`;
  const submit = async (changes: Partial<ClaimSubmissionInput> = {}, idempotencyKey = key(), count = 1) => {
    const form = new FormData();
    for (const [name, value] of Object.entries({ ...input, ...changes })) if (value !== undefined) form.set(name, String(value));
    for (let i = 0; i < count; i++) form.append("photos", new Blob([png], { type: "image/png" }), "damage.png");
    const response = await request(base, { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body: form });
    const body = await response.json() as { claim: ClaimResponse; claimId: string; replayed: boolean };
    const id = body.claim?.id ?? body.claimId;
    if (id && !claimIds.includes(id)) claimIds.push(id);
    return { response, body };
  };
  async function until(check: () => Promise<boolean>) {
    const deadline = Date.now() + 12_000;
    while (!await check()) {
      if (Date.now() > deadline) throw new Error("Claim transition timed out.");
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
  }
  const waitFor = async (id: string, status: string) => until(async () => (await service.getClaim(id)).status === status);

  try {
    await t.test("multipart submission persists pending claim, image metadata and outbox; replay does not upload again", async () => {
      const requestKey = key();
      const first = await submit({}, requestKey);
      assert.equal(first.response.status, 202);
      assert.equal(first.body.claim.status, "pending");
      assert.equal(first.body.claim.images.length, 1);
      assert.equal(first.body.claim.insurance_result, null);
      assert(!("processing_token" in first.body.claim));
      assert(await prisma.claimOutbox.findUnique({ where: { claim_id: first.body.claim.id } }));
      const before = uploads;
      const replay = await submit({}, requestKey);
      assert.equal(replay.response.status, 200);
      assert.equal(replay.body.claim.id, first.body.claim.id);
      assert.equal(uploads, before);
      assert.equal((await submit({ crop: "wheat" }, requestKey)).response.status, 409);
      await service.dispatchPending(claimQueue);
      await waitFor(first.body.claim.id, "awaiting_analysis");
      const saved = await request(`${base}/${first.body.claim.id}`).then((r) => r.json()) as { claim: ClaimResponse };
      assert.equal(saved.claim.insurance_result?.result, true);
      assert.equal(saved.claim.attempt_count, 1);
      await service.processClaim(first.body.claim.id, 2);
      assert.equal((await service.getClaim(first.body.claim.id)).attempt_count, 1);
    });

    await t.test("partial and false outcomes persist their distinct statuses", async () => {
      const partial = await submit({ crop: "wheat" });
      const missing = await submit({ policy_number: "TEST-NOT-FOUND" });
      await service.dispatchPending(claimQueue);
      await waitFor(partial.body.claim.id, "needs_correction");
      await waitFor(missing.body.claim.id, "needs_review");
      assert.equal((await service.getClaim(partial.body.claim.id)).insurance_result?.result, "partial");
      assert.equal((await service.getClaim(missing.body.claim.id)).insurance_result?.result, false);
    });

    await t.test("invalid form and missing photos are rejected before creating a claim", async () => {
      assert.equal((await submit({ event_date: "2026-02-30" })).response.status, 400);
      assert.equal((await submit({}, key(), 0)).response.status, 400);
      assert.equal((await request(`${base}/not-a-uuid`)).status, 400);
      assert.equal((await request(`${base}/${randomUUID()}`)).status, 404);
    });

    await t.test("upload failure persists failed state and cleanup receipts until deletion succeeds", async () => {
      failUploadAt = uploads + 2;
      failDelete = true;
      const failed = await submit({}, key(), 2);
      assert.equal(failed.response.status, 502);
      assert.equal((await service.getClaim(failed.body.claimId)).status, "failed");
      assert.equal(await prisma.claimOutbox.count({ where: { claim_id: failed.body.claimId } }), 0);
      assert.equal(await prisma.claimImage.count({ where: { claim_id: failed.body.claimId, cleanup_pending: true } }), 1);
      failDelete = false;
      await service.cleanupFailedImages();
      assert(deleted.length > 0);
      assert.equal(await prisma.claimImage.count({ where: { claim_id: failed.body.claimId, cleanup_pending: true } }), 0);
      failUploadAt = -1;
    });

    await t.test("queue outage keeps pending data recoverable; redelivery uses the same claim ID", async () => {
      const pending = await submit();
      await service.dispatchPending({ enqueue: async () => { throw new Error("Redis unavailable"); }, state: async () => "missing" });
      assert.equal((await service.getClaim(pending.body.claim.id)).status, "pending");
      const entry = await prisma.claimOutbox.findUniqueOrThrow({ where: { claim_id: pending.body.claim.id } });
      assert.equal(entry.dispatched_at, null);
      assert.equal(entry.attempt_count, 1);
      await prisma.claimOutbox.update({ where: { claim_id: pending.body.claim.id }, data: { available_at: new Date() } });
      await service.dispatchPending(claimQueue);
      await waitFor(pending.body.claim.id, "awaiting_analysis");
    });

    await t.test("image/outbox transaction rolls back together; abandoned uploads become visible failures", async () => {
      const previousImage = await prisma.claimImage.findFirstOrThrow({ where: { claim_id: { in: claimIds }, deleted_at: null } });
      duplicateFileId = previousImage.imagekit_file_id;
      const rolledBack = await submit();
      duplicateFileId = undefined;
      assert.equal(rolledBack.response.status, 503);
      const id = rolledBack.body.claimId;
      assert.equal(await prisma.claimImage.count({ where: { claim_id: id } }), 0);
      assert.equal(await prisma.claimOutbox.count({ where: { claim_id: id } }), 0);
      assert.equal((await service.getClaim(id)).status, "pending");
      await prisma.claim.update({ where: { id }, data: { created_at: new Date(Date.now() - 20 * 60_000) } });
      await service.recoverClaims(claimQueue);
      assert.equal((await service.getClaim(id)).status, "failed");
    });

    await t.test("a fast worker result cannot be overwritten by the queued acknowledgement", async () => {
      const pending = await submit();
      await service.dispatchPending({ enqueue: (id) => service.processClaim(id, 1), state: async () => "other" });
      assert.equal((await service.getClaim(pending.body.claim.id)).status, "awaiting_analysis");
      assert((await service.getClaim(pending.body.claim.id)).queued_at);
    });

    await t.test("terminal state recovers an enqueue acknowledgement lost after the worker finished", async () => {
      const pending = await submit();
      await service.dispatchPending({ enqueue: async (id) => {
        await service.processClaim(id, 1);
        throw new Error("Lost enqueue acknowledgement");
      }, state: async () => "other" });
      assert.equal((await service.getClaim(pending.body.claim.id)).status, "awaiting_analysis");
      await service.recoverClaims(claimQueue);
      assert((await prisma.claimOutbox.findUniqueOrThrow({ where: { claim_id: pending.body.claim.id } })).dispatched_at);
    });

    await t.test("BullMQ retries transient verification errors and stores final failure after exhaustion", async () => {
      let calls = 0;
      override = async () => { if (calls++ === 0) throw new Error("Transient database failure"); return { result: true, reason: Reason.Verified }; };
      const retry = await submit();
      await service.dispatchPending(claimQueue);
      await waitFor(retry.body.claim.id, "awaiting_analysis");
      assert.equal((await service.getClaim(retry.body.claim.id)).attempt_count, 2);
      override = async () => { throw new Error("Persistent verification failure"); };
      const exhausted = await submit();
      await service.dispatchPending(claimQueue);
      await waitFor(exhausted.body.claim.id, "failed");
      assert.equal((await service.getClaim(exhausted.body.claim.id)).attempt_count, 3);
      override = undefined;
    });

    await t.test("lost Redis job is reconciled from the database outbox", async () => {
      await worker.pause();
      const lost = await submit();
      await service.dispatchPending(claimQueue);
      const job = await queue.getJob(lost.body.claim.id);
      assert(job);
      await job.remove();
      await prisma.claim.update({ where: { id: lost.body.claim.id }, data: { updated_at: new Date(Date.now() - 60_000) } });
      await service.recoverClaims(claimQueue);
      assert.equal((await service.getClaim(lost.body.claim.id)).status, "pending");
      await service.dispatchPending(claimQueue);
      worker.resume();
      await waitFor(lost.body.claim.id, "awaiting_analysis");
    });

    await t.test("stale worker token cannot replace a newer successful result", async () => {
      const pending = await submit();
      let release!: (value: InsuranceVerificationResult) => void;
      let started = false;
      override = async () => { started = true; return new Promise((resolve) => { release = resolve; }); };
      const old = service.processClaim(pending.body.claim.id, 1);
      await until(async () => started);
      override = async () => ({ result: true, reason: Reason.Verified });
      await service.processClaim(pending.body.claim.id, 2);
      release({ result: false, reason: Reason.NotFound });
      await old;
      assert.equal((await service.getClaim(pending.body.claim.id)).insurance_result?.result, true);
      override = undefined;
    });
  } finally {
    await worker.close();
    await closeClaimQueue();
    for (const id of claimIds) {
      const job = await queue.getJob(id);
      if (job) await job.remove();
    }
    await queue.close();
    workerConnection.disconnect();
    inspectionConnection.disconnect();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await prisma.claimOutbox.deleteMany({ where: { claim_id: { in: claimIds } } });
    await prisma.claimImage.deleteMany({ where: { claim_id: { in: claimIds } } });
    await prisma.claim.deleteMany({ where: { id: { in: claimIds } } });
    await prisma.user.delete({ where: { id: account.id } });
    await prisma.insurancePolicy.delete({ where: { id: policy.id } });
    await prisma.$disconnect();
    for (const key of redisKeys) {
      if (previousRedis[key] === undefined) delete process.env[key];
      else process.env[key] = previousRedis[key];
    }
  }
});
