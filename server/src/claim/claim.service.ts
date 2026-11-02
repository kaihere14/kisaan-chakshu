import { createHash, randomUUID } from "node:crypto";
import { getPrisma } from "../config/prisma.js";
import { claimImageStore } from "../config/imagekit.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import { verifyInsurance } from "../insurance/insurance.controller.js";
import type { InsuranceVerificationInput, InsuranceVerificationResult } from "../insurance/insurance.types.js";
import { HttpError } from "../utils/http-error.js";
import { MAX_CLAIM_PHOTOS, MAX_PHOTO_BYTES } from "./claim.schema.js";
import type {
  ClaimImageStore, ClaimQueueTransport, ClaimResponse, ClaimSubmissionInput,
  ClaimUpload, ClaimWithImages, StoredClaimImage,
} from "./claim.types.js";

const includeImages = { images: { orderBy: { created_at: "asc" as const } } };
const unfinished = ["pending", "queued", "processing"] as const;
const RETRY_LIMIT = 3;
export const UPLOAD_TIMEOUT_MS = 15 * 60_000;
const RECOVERY_DELAY_MS = 30_000;

function responseFor(claim: ClaimWithImages): ClaimResponse {
  const { idempotency_key: _key, request_hash: _hash, processing_token: _token,
    images_ready: _ready, images, insurance_result, ...fields } = claim;
  return {
    ...fields,
    latitude: claim.latitude?.toString() ?? null,
    longitude: claim.longitude?.toString() ?? null,
    event_date: claim.event_date.toISOString().slice(0, 10),
    created_at: claim.created_at.toISOString(),
    updated_at: claim.updated_at.toISOString(),
    queued_at: claim.queued_at?.toISOString() ?? null,
    processing_started_at: claim.processing_started_at?.toISOString() ?? null,
    finished_at: claim.finished_at?.toISOString() ?? null,
    insurance_result: insurance_result as InsuranceVerificationResult | null,
    images: images.map((image) => ({
      id: image.id, url: image.url, file_name: image.file_name, mime_type: image.mime_type,
      size_bytes: image.size_bytes, deleted_at: image.deleted_at?.toISOString() ?? null,
    })),
  };
}

export function validateClaimPhotos(files: ClaimUpload[]): void {
  if (files.length < 1 || files.length > MAX_CLAIM_PHOTOS) {
    throw new HttpError(400, "invalid_photo_count", "Provide between 1 and 5 photos in the photos field.");
  }
  for (const file of files) {
    if (!file.buffer.length || file.buffer.length > MAX_PHOTO_BYTES) {
      throw new HttpError(413, "invalid_photo_size", "Each photo must contain data and be at most 5 MiB.");
    }
    const bytes = file.buffer;
    const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const webp = bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    if (!((file.mimeType === "image/jpeg" && jpeg) || (file.mimeType === "image/png" && png) || (file.mimeType === "image/webp" && webp))) {
      throw new HttpError(415, "invalid_image", "Photo signatures must match JPEG, PNG or WebP content.");
    }
  }
}

function requestHash(input: ClaimSubmissionInput, files: ClaimUpload[]): string {
  return createHash("sha256").update(JSON.stringify({
    policy_number: input.policy_number, owner_demo_id: input.owner_demo_id, owner_name: input.owner_name,
    plot_id: input.plot_id, crop: input.crop, season: input.season, season_year: input.season_year,
    peril: input.peril, event_date: input.event_date, latitude: input.latitude ?? null,
    longitude: input.longitude ?? null, description: input.description ?? null,
    files: files.map((file) => ({ name: file.fileName, type: file.mimeType,
      hash: createHash("sha256").update(file.buffer).digest("hex") })),
  })).digest("hex");
}

interface ClaimDependencies {
  prisma: PrismaClient;
  images: ClaimImageStore;
  verify?: (input: InsuranceVerificationInput) => Promise<InsuranceVerificationResult>;
}

export function createClaimService({ prisma, images, verify = verifyInsurance }: ClaimDependencies) {
  async function getClaim(id: string): Promise<ClaimResponse> {
    const claim = await prisma.claim.findUnique({ where: { id }, include: includeImages });
    if (!claim) throw new HttpError(404, "claim_not_found", "Claim not found.");
    return responseFor(claim);
  }

  async function cleanupFailedImages(): Promise<void> {
    const pending = await prisma.claimImage.findMany({
      where: { cleanup_pending: true, deleted_at: null, claim: { status: "failed" } }, take: 10,
    });
    await Promise.all(pending.map(async (image) => {
      try {
        await images.delete(image.imagekit_file_id);
        await prisma.claimImage.update({ where: { id: image.id }, data: { cleanup_pending: false, deleted_at: new Date() } });
      } catch { /* Keep the receipt for another cleanup attempt. */ }
    }));
  }

  async function submitClaim(input: ClaimSubmissionInput, files: ClaimUpload[], key: string) {
    validateClaimPhotos(files);
    const hash = requestHash(input, files);
    let existing = await prisma.claim.findUnique({ where: { idempotency_key: key }, include: includeImages });
    const replay = (claim: ClaimWithImages) => {
      if (claim.request_hash !== hash) throw new HttpError(409, "idempotency_conflict", "This Idempotency-Key belongs to a different submission.");
      return { claim: responseFor(claim), replayed: true };
    };
    if (existing) return replay(existing);

    let claimId: string;
    try {
      const claim = await prisma.claim.create({ data: {
        ...input, event_date: new Date(`${input.event_date}T00:00:00.000Z`),
        idempotency_key: key, request_hash: hash,
      } });
      claimId = claim.id;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        existing = await prisma.claim.findUnique({ where: { idempotency_key: key }, include: includeImages });
        if (existing) return replay(existing);
      }
      throw error;
    }

    const uploaded: Array<StoredClaimImage & { file: ClaimUpload }> = [];
    try {
      for (const [index, file] of files.entries()) {
        uploaded.push({ ...await images.upload(claimId, file, index), file });
      }
    } catch {
      // Keep deletion receipts in PostgreSQL so failed cleanup can be retried.
      await prisma.$transaction(async (transaction) => {
        await transaction.claim.update({ where: { id: claimId }, data: {
          status: "failed", last_error: "Photo upload failed.", finished_at: new Date(),
        } });
        if (uploaded.length) await transaction.claimImage.createMany({ data: uploaded.map((image) => ({
          claim_id: claimId, imagekit_file_id: image.fileId, url: image.url,
          file_name: image.file.fileName, mime_type: image.file.mimeType,
          size_bytes: image.file.buffer.length, cleanup_pending: true,
        })) });
      });
      await cleanupFailedImages();
      throw new HttpError(502, "image_upload_failed", "Photo upload failed. Inspect the saved claim before submitting again.", claimId);
    }

    try {
      await prisma.$transaction(async (transaction) => {
        const ready = await transaction.claim.updateMany({
          where: { id: claimId, status: "pending", stage: "upload", images_ready: false },
          data: { images_ready: true, stage: "dispatch" },
        });
        if (!ready.count) throw new Error("The claim upload reservation expired.");
        await transaction.claimImage.createMany({ data: uploaded.map((image) => ({
          claim_id: claimId, imagekit_file_id: image.fileId, url: image.url,
          file_name: image.file.fileName, mime_type: image.file.mimeType, size_bytes: image.file.buffer.length,
        })) });
        await transaction.claimOutbox.create({ data: { claim_id: claimId } });
      });
    } catch {
      // A lost commit acknowledgement is ambiguous. Do not delete files that a
      // committed claim/worker could already reference; a replay reads the DB.
      throw new HttpError(503, "claim_persistence_unavailable", "Could not confirm claim persistence. Retry with the same Idempotency-Key or inspect the claim.", claimId);
    }
    return { claim: await getClaim(claimId), replayed: false };
  }

  async function dispatchPending(queue: ClaimQueueTransport): Promise<void> {
    const entries = await prisma.claimOutbox.findMany({
      where: { dispatched_at: null, available_at: { lte: new Date() }, claim: { images_ready: true, status: { in: [...unfinished] } } },
      orderBy: { created_at: "asc" }, take: 20,
    });
    for (const entry of entries) {
      try {
        await queue.enqueue(entry.claim_id);
        await prisma.$transaction(async (transaction) => {
          await transaction.claimOutbox.updateMany({ where: { claim_id: entry.claim_id, dispatched_at: null },
            data: { dispatched_at: new Date(), last_error: null } });
          // A fast worker may already be processing or finished. Never regress it.
          await transaction.claim.updateMany({ where: { id: entry.claim_id, status: "pending", images_ready: true },
            data: { status: "queued", stage: "insurance", queued_at: new Date(), last_error: null } });
          await transaction.claim.updateMany({ where: { id: entry.claim_id, images_ready: true, queued_at: null },
            data: { queued_at: new Date() } });
        });
      } catch {
        await prisma.claimOutbox.updateMany({ where: { claim_id: entry.claim_id, dispatched_at: null }, data: {
          attempt_count: { increment: 1 }, last_error: "Queue dispatch unavailable.",
          available_at: new Date(Date.now() + Math.min(60_000, 1000 * 2 ** Math.min(entry.attempt_count, 6))),
        } });
      }
    }
  }

  async function processClaim(claimId: string, attempt: number, maxAttempts = RETRY_LIMIT): Promise<void> {
    const token = randomUUID();
    const acquired = await prisma.claim.updateMany({
      where: { id: claimId, images_ready: true, status: { in: [...unfinished] } },
      data: { status: "processing", stage: "insurance", processing_token: token,
        attempt_count: { increment: 1 }, processing_started_at: new Date(), last_error: null },
    });
    if (!acquired.count) return;
    try {
      const claim = await prisma.claim.findUniqueOrThrow({ where: { id: claimId } });
      if (claim.processing_token !== token) return;
      const result = await verify({
        policy_number: claim.policy_number, owner_demo_id: claim.owner_demo_id, owner_name: claim.owner_name,
        plot_id: claim.plot_id, crop: claim.crop, season: claim.season, season_year: claim.season_year,
        peril: claim.peril, event_date: claim.event_date.toISOString().slice(0, 10),
      });
      const status = result.result === true ? "awaiting_analysis"
        : result.result === "partial" ? "needs_correction" : "needs_review";
      await prisma.claim.updateMany({
        where: { id: claimId, status: "processing", processing_token: token },
        data: { status, stage: status === "awaiting_analysis" ? "awaiting_analysis" : "finished",
          insurance_result: result, processing_token: null, finished_at: new Date(), last_error: null },
      });
    } catch (error) {
      await prisma.claim.updateMany({
        where: { id: claimId, status: "processing", processing_token: token },
        data: { status: attempt >= maxAttempts ? "failed" : "queued",
          stage: attempt >= maxAttempts ? "finished" : "insurance", processing_token: null,
          finished_at: attempt >= maxAttempts ? new Date() : null, last_error: "Insurance verification could not be completed." },
      });
      throw error;
    }
  }

  async function recoverClaims(queue: ClaimQueueTransport): Promise<void> {
    // A worker can finish even if the dispatcher's DB acknowledgement was lost.
    // Its persisted terminal state proves delivery and closes that outbox entry.
    await prisma.claimOutbox.updateMany({
      where: { dispatched_at: null, claim: { images_ready: true,
        status: { in: ["awaiting_analysis", "needs_correction", "needs_review", "failed"] } } },
      data: { dispatched_at: new Date(), last_error: null },
    });
    // Incomplete uploads cannot survive an API process crash; surface the failure.
    await prisma.claim.updateMany({
      where: { status: "pending", images_ready: false, created_at: { lt: new Date(Date.now() - UPLOAD_TIMEOUT_MS) } },
      data: { status: "failed", last_error: "Photo upload did not complete. Please submit again with a new Idempotency-Key.", finished_at: new Date() },
    });
    const stale = await prisma.claim.findMany({
      where: { status: { in: ["queued", "processing"] }, updated_at: { lt: new Date(Date.now() - RECOVERY_DELAY_MS) } },
      take: 20, orderBy: { updated_at: "asc" },
    });
    for (const claim of stale) {
      const state = await queue.state(claim.id);
      if (state === "failed") {
        await prisma.claim.updateMany({ where: { id: claim.id, status: claim.status, updated_at: claim.updated_at },
          data: { status: "failed", stage: "finished", processing_token: null, finished_at: new Date(), last_error: "Queue processing exhausted its retries or stalled." } });
      } else if (state === "missing") {
        await prisma.$transaction(async (transaction) => {
          const reset = await transaction.claim.updateMany({ where: { id: claim.id, status: claim.status, updated_at: claim.updated_at },
            data: { status: "pending", stage: "dispatch", processing_token: null } });
          if (reset.count) await transaction.claimOutbox.update({ where: { claim_id: claim.id },
            data: { dispatched_at: null, available_at: new Date(), last_error: "Queue job was missing; scheduled redelivery." } });
        });
      }
    }
    await cleanupFailedImages();
  }

  return { submitClaim, getClaim, dispatchPending, processClaim, recoverClaims, cleanupFailedImages };
}

export type ClaimService = ReturnType<typeof createClaimService>;
let defaultService: ClaimService | undefined;
export function getClaimService(): ClaimService {
  return defaultService ??= createClaimService({ prisma: getPrisma(), images: claimImageStore });
}
