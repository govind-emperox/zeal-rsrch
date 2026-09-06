import { PgBoss } from "pg-boss";
import {
  ResearchCancelPayloadSchema,
  ResearchResumePayloadSchema,
  ResearchRunPayloadSchema,
  RetentionCleanupPayloadSchema,
} from "@zeal-rsrch/contracts";

export const QUEUES = ["research.run", "research.resume", "research.cancel", "retention.cleanup"] as const;
export type QueueName = (typeof QUEUES)[number];

const QUEUE_OPTIONS = { retryLimit: 3, retryDelay: 5, expireInHours: 2 } as const;

export function assertQueuePayload(queue: QueueName, payload: unknown): void {
  switch (queue) {
    case "research.run": ResearchRunPayloadSchema.parse(payload); break;
    case "research.resume": ResearchResumePayloadSchema.parse(payload); break;
    case "research.cancel": ResearchCancelPayloadSchema.parse(payload); break;
    case "retention.cleanup": RetentionCleanupPayloadSchema.parse(payload); break;
  }
}

export async function createQueues(boss: PgBoss): Promise<void> {
  for (const queue of QUEUES) await boss.createQueue(queue, QUEUE_OPTIONS);
}

export async function enqueue(boss: PgBoss, queue: QueueName, payload: unknown): Promise<string> {
  assertQueuePayload(queue, payload);
  const jobId = await boss.send(queue, payload as object, { singletonKey: (payload as { idempotencyKey: string }).idempotencyKey });
  if (!jobId) throw new Error(`Unable to enqueue ${queue}`);
  return jobId;
}
