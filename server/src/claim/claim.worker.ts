import "../config/env.js";
import { Worker, UnrecoverableError } from "bullmq";
import { Redis } from "ioredis";
import { getRedisConfig } from "../config/env.js";
import { getPrisma } from "../config/prisma.js";
import { CLAIM_QUEUE_NAME, claimQueue, closeClaimQueue } from "./claim.queue.js";
import { getClaimService } from "./claim.service.js";
import { claimIdSchema } from "./claim.schema.js";
import type { ClaimJobData } from "./claim.types.js";

async function main(): Promise<void> {
  const service = getClaimService();
  const connection = new Redis({ ...getRedisConfig(), maxRetriesPerRequest: null });
  connection.on("error", () => { console.error("Claim worker Redis connection unavailable; reconnecting."); });
  const worker = new Worker<ClaimJobData>(CLAIM_QUEUE_NAME, async (job) => {
    const parsed = claimIdSchema.safeParse(job.data?.claimId);
    if (!parsed.success || job.id !== parsed.data) throw new UnrecoverableError("Invalid claim job identity.");
    await service.processClaim(parsed.data, job.attemptsMade + 1, job.opts.attempts ?? 3);
  }, { connection, concurrency: 2 });
  worker.on("error", () => { console.error("Claim worker encountered a queue error."); });

  let stopping = false;
  let running: Promise<void> | undefined;
  function tick(): Promise<void> {
    if (stopping) return Promise.resolve();
    return running ??= (async () => {
      try {
        await service.recoverClaims(claimQueue);
        await service.dispatchPending(claimQueue);
      } catch {
        console.error("Claim recovery/dispatch unavailable; retrying on the next pass.");
      }
    })().finally(() => { running = undefined; });
  }
  const interval = setInterval(() => { void tick(); }, 2000);
  worker.on("failed", () => { void tick(); });
  void tick();
  console.log("Claim worker and outbox dispatcher started.");

  async function shutdown(): Promise<void> {
    if (stopping) return;
    stopping = true;
    clearInterval(interval);
    await running;
    await worker.close();
    await closeClaimQueue();
    connection.disconnect();
    await getPrisma().$disconnect();
  }
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      shutdown().catch(() => { console.error("Claim worker shutdown failed."); process.exitCode = 1; });
    });
  }
}

main().catch((error: unknown) => {
  // Configuration errors name missing variables without printing their values.
  console.error(error instanceof Error ? error.message : "Could not start the claim worker.");
  process.exitCode = 1;
});
