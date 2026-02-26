import { randomUUID } from "node:crypto";
import type { ApiKeyRecord, ApiClientContext } from "@/types";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function getApiClientByKey(apiKey: string): Promise<ApiClientContext | null> {
  const supabase = getSupabaseServer();
  // #region agent log
  fetch("http://127.0.0.1:7425/ingest/6e171a64-100c-471f-a0f7-68ec2fd33586", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "7da2b2",
    },
    body: JSON.stringify({
      sessionId: "7da2b2",
      runId: "initial",
      hypothesisId: "H1",
      location: "src/lib/server/db.ts:getApiClientByKey",
      message: "getApiClientByKey called",
      data: {
        apiKeyLength: apiKey.length,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  const res = await (supabase as any)
    .from("api_keys")
    .select("key_id, plan, request_limit_per_minute, active")
    .eq("api_key", apiKey)
    .eq("active", true)
    .maybeSingle();
  const row = res?.data as any;
  if (!row) return null;
  await (supabase as any).from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("key_id", row.key_id);
  return {
    keyId: row.key_id,
    plan: row.plan as ApiClientContext["plan"],
    requestLimitPerMinute: row.request_limit_per_minute,
  };
}

export async function consumeRateLimit(keyId: string, maxRequests: number): Promise<{ ok: true; remaining: number } | { ok: false; retryAfterSec: number }> {
  const supabase = getSupabaseServer();
  const now = Date.now();
  const windowMs = 60_000;
  const { data } = await (supabase as any).from("rate_limits").select("*").eq("key_id", keyId).maybeSingle();
  // #region agent log
  fetch("http://127.0.0.1:7425/ingest/6e171a64-100c-471f-a0f7-68ec2fd33586", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "7da2b2",
    },
    body: JSON.stringify({
      sessionId: "7da2b2",
      runId: "initial",
      hypothesisId: "H2",
      location: "src/lib/server/db.ts:consumeRateLimit",
      message: "consumeRateLimit loaded row",
      data: {
        hasRow: !!data,
        keyId,
        now,
        resetAt: data?.reset_at ?? null,
        resetAtType: data ? typeof (data as any).reset_at : null,
        count: data?.count ?? null,
        maxRequests,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (!data || now >= data.reset_at) {
    await (supabase as any)
      .from("rate_limits")
      .upsert({ key_id: keyId, count: 1, reset_at: now + windowMs }, { onConflict: "key_id" });
    return { ok: true, remaining: Math.max(0, maxRequests - 1) };
  }
  if (data.count >= maxRequests) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((data.reset_at - now) / 1000)) };
  }
  await (supabase as any).from("rate_limits").update({ count: data.count + 1 }).eq("key_id", keyId);
  return { ok: true, remaining: Math.max(0, maxRequests - (data.count + 1)) };
}

export async function issueApiKey(plan: ApiClientContext["plan"], label?: string): Promise<ApiKeyRecord> {
  const supabase = getSupabaseServer();
  const keyId = `k_${randomUUID().slice(0, 8)}`;
  const apiKey = `eco_${plan}_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
  const limits: Record<ApiClientContext["plan"], number> = { free: 12, pro: 90, enterprise: 500 };
  const createdAt = new Date().toISOString();
  await (supabase as any).from("api_keys").insert({
    api_key: apiKey,
    key_id: keyId,
    plan,
    request_limit_per_minute: limits[plan],
    active: true,
    created_at: createdAt,
    label: label?.trim().slice(0, 80) || null,
  });
  return {
    apiKey,
    keyId,
    plan,
    requestLimitPerMinute: limits[plan],
    active: true,
    createdAt,
    label,
  };
}

export async function listApiKeys(): Promise<ApiKeyRecord[]> {
  const supabase = getSupabaseServer();
  const { data } = await (supabase as any).from("api_keys").select("*").order("created_at", { ascending: false });
  return (data || []).map((k: any) => ({
    apiKey: k.api_key,
    keyId: k.key_id,
    plan: k.plan,
    requestLimitPerMinute: k.request_limit_per_minute,
    active: k.active,
    createdAt: k.created_at,
    lastUsedAt: k.last_used_at || undefined,
    label: k.label || undefined,
  }));
}

export async function getDbStatus(): Promise<{ provider: "file-json" | "supabase"; path: string; keyCount: number }> {
  const supabase = getSupabaseServer();
  const { count } = await (supabase as any).from("api_keys").select("key_id", { count: "exact", head: true });
  return { provider: "supabase", path: "supabase.public.api_keys", keyCount: count || 0 };
}
