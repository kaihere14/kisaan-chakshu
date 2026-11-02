import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { getRedisConfig } from "../config/env.js";
import type { ClaimJobData, ClaimQueueTransport } from "./claim.types.js";

export const CLAIM_QUEUE_NAME = "claim-insurance";
let producer: { queue: Queue<ClaimJobData>; connection: Redis } | undefined;
let connecting: Promise<Queue<ClaimJobData>> | undefined;

async function getQueue(): Promise<Queue<ClaimJobData>> {
  if (producer?.connection.status === "ready") return producer.queue;
  return connecting ??= (async () => {
    if (producer) {
      producer.connection.disconnect();
      await producer.queue.close().catch(() => {});
      producer = undefined;
    }
    const connection = new Redis({
      ...getRedisConfig(),
      lazyConnect: true, enableOfflineQueue: false, maxRetriesPerRequest: 1,
      connectTimeout: 3000, commandTimeout: 5000, retryStrategy: () => null,
    });
    connection.on("error", () => { /* The outbox persists dispatch failures. */ });
    try {
      await connection.connect();
      const queue = new Queue<ClaimJobData>(CLAIM_QUEUE_NAME, {
        connection, skipWaitingForReady: true,
        defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: false, removeOnFail: false },
      });
      queue.on("error", () => { /* Report through persisted outbox metadata. */ });
      producer = { queue, connection };
      return queue;
    } catch (error) {
      connection.disconnect();
      throw error;
    }
  })().finally(() => { connecting = undefined; });
}

export const claimQueue: ClaimQueueTransport = {
  async enqueue(claimId) {
    const queue = await getQueue();
    // UUIDs contain no colons and provide stable deduplication across dispatch retries.
    await queue.add("verify-insurance", { claimId }, { jobId: claimId });
  },
  async state(claimId) {
    const job = await (await getQueue()).getJob(claimId);
    if (!job) return "missing";
    return await job.getState() === "failed" ? "failed" : "other";
  },
};

export async function closeClaimQueue(): Promise<void> {
  if (connecting) await connecting.catch(() => {});
  if (producer) {
    await producer.queue.close();
    producer.connection.disconnect();
    producer = undefined;
  }
}
