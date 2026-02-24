import { consumeRateLimit } from "@/lib/server/db";

export async function checkRateLimit(
  key: string,
  maxRequests: number
): Promise<{ ok: true; remaining: number } | { ok: false; retryAfterSec: number }> {
  return consumeRateLimit(key, maxRequests);
}
