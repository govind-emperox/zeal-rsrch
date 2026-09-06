import type { RetentionClass } from "@zeal-rsrch/contracts";

const RETAINED_CLASSES = new Set<RetentionClass>([
  "final_report",
  "source_manifest",
  "cleanup_audit",
  "user_file",
]);

export function shouldRetain(retentionClass: RetentionClass): boolean {
  return RETAINED_CLASSES.has(retentionClass);
}

export function shouldDeleteAfterRun(retentionClass: RetentionClass): boolean {
  return !shouldRetain(retentionClass);
}

export function partitionRetention<T extends { retentionClass: RetentionClass }>(items: readonly T[]): {
  retain: T[];
  remove: T[];
} {
  const retain: T[] = [];
  const remove: T[] = [];

  for (const item of items) {
    (shouldRetain(item.retentionClass) ? retain : remove).push(item);
  }

  return { retain, remove };
}
