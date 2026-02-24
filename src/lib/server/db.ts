import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { ApiKeyRecord, ApiClientContext } from "@/types";

type RateBucket = { count: number; resetAt: number };

type DbShape = {
  apiKeys: ApiKeyRecord[];
  rateLimits: Record<string, RateBucket>;
};

const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "ecoscan-db.json");

const DEFAULT_KEYS: ApiKeyRecord[] = [
  {
    apiKey: "eco_free_demo_key",
    keyId: "free-demo",
    plan: "free",
    requestLimitPerMinute: 12,
    active: true,
    createdAt: new Date().toISOString(),
    label: "Free demo",
  },
  {
    apiKey: "eco_pro_demo_key",
    keyId: "pro-demo",
    plan: "pro",
    requestLimitPerMinute: 90,
    active: true,
    createdAt: new Date().toISOString(),
    label: "Pro demo",
  },
  {
    apiKey: "eco_enterprise_demo_key",
    keyId: "ent-demo",
    plan: "enterprise",
    requestLimitPerMinute: 500,
    active: true,
    createdAt: new Date().toISOString(),
    label: "Enterprise demo",
  },
];

let queue = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(() => undefined, () => undefined);
  return run;
}

async function ensureDb(): Promise<DbShape> {
  await mkdir(DB_DIR, { recursive: true });
  try {
    const raw = await readFile(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<DbShape>;
    return {
      apiKeys: Array.isArray(parsed.apiKeys) ? parsed.apiKeys : DEFAULT_KEYS,
      rateLimits: parsed.rateLimits && typeof parsed.rateLimits === "object" ? parsed.rateLimits : {},
    };
  } catch {
    const initial: DbShape = { apiKeys: DEFAULT_KEYS, rateLimits: {} };
    await writeFile(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

async function saveDb(db: DbShape): Promise<void> {
  await writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

export async function getApiClientByKey(apiKey: string): Promise<ApiClientContext | null> {
  return withLock(async () => {
    const db = await ensureDb();
    const key = db.apiKeys.find((k) => k.apiKey === apiKey && k.active);
    if (!key) return null;
    key.lastUsedAt = new Date().toISOString();
    await saveDb(db);
    return {
      keyId: key.keyId,
      plan: key.plan,
      requestLimitPerMinute: key.requestLimitPerMinute,
    };
  });
}

export async function consumeRateLimit(keyId: string, maxRequests: number): Promise<{ ok: true; remaining: number } | { ok: false; retryAfterSec: number }> {
  return withLock(async () => {
    const db = await ensureDb();
    const now = Date.now();
    const windowMs = 60_000;
    const bucket = db.rateLimits[keyId];

    if (!bucket || now >= bucket.resetAt) {
      db.rateLimits[keyId] = { count: 1, resetAt: now + windowMs };
      await saveDb(db);
      return { ok: true, remaining: Math.max(0, maxRequests - 1) };
    }

    if (bucket.count >= maxRequests) {
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
    }

    bucket.count += 1;
    await saveDb(db);
    return { ok: true, remaining: Math.max(0, maxRequests - bucket.count) };
  });
}

export async function issueApiKey(plan: ApiClientContext["plan"], label?: string): Promise<ApiKeyRecord> {
  return withLock(async () => {
    const db = await ensureDb();
    const keyId = `k_${randomUUID().slice(0, 8)}`;
    const apiKey = `eco_${plan}_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
    const limits: Record<ApiClientContext["plan"], number> = { free: 12, pro: 90, enterprise: 500 };
    const record: ApiKeyRecord = {
      apiKey,
      keyId,
      plan,
      requestLimitPerMinute: limits[plan],
      active: true,
      createdAt: new Date().toISOString(),
      label: label?.trim().slice(0, 80),
    };
    db.apiKeys.push(record);
    await saveDb(db);
    return record;
  });
}

export async function listApiKeys(): Promise<ApiKeyRecord[]> {
  return withLock(async () => {
    const db = await ensureDb();
    return [...db.apiKeys];
  });
}

export async function getDbStatus(): Promise<{ provider: "file-json"; path: string; keyCount: number }> {
  return withLock(async () => {
    const db = await ensureDb();
    return {
      provider: "file-json",
      path: DB_FILE,
      keyCount: db.apiKeys.length,
    };
  });
}

