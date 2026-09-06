export const FAILURE_CODES = [
  "codex_unavailable",
  "codex_protocol_mismatch",
  "approval_required",
  "approval_denied",
  "firecrawl_unavailable",
  "search_failed",
  "scrape_incomplete",
  "verification_failed",
  "cleanup_partial_failure",
  "storage_unavailable",
  "postgres_unavailable",
  "invalid_request",
  "cancelled",
  "unknown",
] as const;

export type FailureCode = (typeof FAILURE_CODES)[number];
export type FailureDisposition = "retry" | "blocked" | "failed" | "cancelled";

export type FailureClassification = {
  disposition: FailureDisposition;
  retryable: boolean;
  retryAfterMs: number | null;
};

const RETRY_DELAYS: Partial<Record<FailureCode, number>> = {
  codex_unavailable: 5_000,
  firecrawl_unavailable: 30_000,
  search_failed: 10_000,
  scrape_incomplete: 10_000,
  storage_unavailable: 5_000,
  postgres_unavailable: 5_000,
  cleanup_partial_failure: 30_000,
};

export function classifyFailure(code: FailureCode): FailureClassification {
  if (code === "approval_required") {
    return { disposition: "blocked", retryable: false, retryAfterMs: null };
  }

  if (code === "cancelled") {
    return { disposition: "cancelled", retryable: false, retryAfterMs: null };
  }

  const retryAfterMs = RETRY_DELAYS[code];
  if (retryAfterMs !== undefined) {
    return { disposition: "retry", retryable: true, retryAfterMs };
  }

  return { disposition: "failed", retryable: false, retryAfterMs: null };
}
