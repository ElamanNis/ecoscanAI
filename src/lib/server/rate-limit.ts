import { consumeRateLimit } from "@/lib/server/db";

export async function checkRateLimit(
  key: string,
  maxRequests: number
): Promise<{ ok: true; remaining: number } | { ok: false; retryAfterSec: number }> {
  try {
    return await consumeRateLimit(key, maxRequests);
  } catch {
    const g = globalThis as unknown as {
      __ecoscanRate?: Record<string, { count: number; resetAt: number }>;
    };
    g.__ecoscanRate = g.__ecoscanRate || {};
    const now = Date.now();
    const windowMs = 60_000;
    const bucket = g.__ecoscanRate[key];
    if (!bucket || now >= bucket.resetAt) {
      g.__ecoscanRate[key] = { count: 1, resetAt: now + windowMs };
      return { ok: true, remaining: Math.max(0, maxRequests - 1) };
    }
    if (bucket.count >= maxRequests) {
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
    }
    bucket.count += 1;
    return { ok: true, remaining: Math.max(0, maxRequests - bucket.count) };
  }
}
