const SAFE_SEGMENT = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,254}$/;

export type RetainedArtifactDirectory = "reports" | "manifests" | "audits" | "uploads";

export class InvalidArtifactKeySegmentError extends Error {
  constructor(segment: string) {
    super(`Unsafe artifact key segment: ${JSON.stringify(segment)}`);
    this.name = "InvalidArtifactKeySegmentError";
  }
}

function assertSafeSegment(segment: string): void {
  if (!SAFE_SEGMENT.test(segment) || segment === "." || segment === "..") {
    throw new InvalidArtifactKeySegmentError(segment);
  }
}

export function projectArtifactKey(
  projectId: string,
  directory: RetainedArtifactDirectory,
  fileName: string,
): string {
  assertSafeSegment(projectId);
  assertSafeSegment(fileName);
  return `projects/${projectId}/${directory}/${fileName}`;
}

export function temporaryTaskPrefix(taskId: string): string {
  assertSafeSegment(taskId);
  return `tmp/${taskId}/`;
}

export function temporaryTaskArtifactKey(taskId: string, fileName: string): string {
  assertSafeSegment(fileName);
  return `${temporaryTaskPrefix(taskId)}${fileName}`;
}
