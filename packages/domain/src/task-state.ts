import type { TaskStatus } from "@zeal-rsrch/contracts";

export const TASK_TRANSITIONS: Readonly<Record<TaskStatus, readonly TaskStatus[]>> = {
  backlog: ["queued", "cancelled", "archived"],
  queued: ["researching", "blocked", "failed", "cancelled"],
  researching: ["drafting", "blocked", "failed", "cancelled"],
  drafting: ["review", "blocked", "failed", "cancelled"],
  review: ["drafting", "done", "blocked", "cancelled", "archived"],
  done: ["review", "archived"],
  blocked: ["queued", "researching", "drafting", "review", "failed", "cancelled"],
  failed: ["queued", "cancelled", "archived"],
  cancelled: ["queued", "archived"],
  archived: [],
};

export class InvalidTaskTransitionError extends Error {
  readonly from: TaskStatus;
  readonly to: TaskStatus;

  constructor(from: TaskStatus, to: TaskStatus) {
    super(`Invalid task transition: ${from} -> ${to}`);
    this.name = "InvalidTaskTransitionError";
    this.from = from;
    this.to = to;
  }
}

export function canTransitionTask(from: TaskStatus, to: TaskStatus): boolean {
  return from === to || TASK_TRANSITIONS[from].includes(to);
}

export function assertTaskTransition(from: TaskStatus, to: TaskStatus): void {
  if (!canTransitionTask(from, to)) {
    throw new InvalidTaskTransitionError(from, to);
  }
}

export function isTerminalTaskStatus(status: TaskStatus): boolean {
  return status === "done" || status === "cancelled" || status === "archived";
}
