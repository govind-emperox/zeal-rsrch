export class RecordNotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
    this.name = "RecordNotFoundError";
  }
}

export class OptimisticLockError extends Error {
  constructor(entity: string, id: string, version: number) {
    super(`${entity} ${id} no longer has expected version ${version}`);
    this.name = "OptimisticLockError";
  }
}

export class ArchivedProjectError extends Error {
  constructor(projectId: string) {
    super(`Cannot add tasks to archived project: ${projectId}`);
    this.name = "ArchivedProjectError";
  }
}

export class BlockedReasonRequiredError extends Error {
  constructor(taskId: string) {
    super(`A blocked reason is required for task: ${taskId}`);
    this.name = "BlockedReasonRequiredError";
  }
}
