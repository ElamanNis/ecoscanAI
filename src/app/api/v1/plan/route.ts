import { NextRequest, NextResponse } from "next/server";
import { resolveApiClient } from "@/lib/server/auth";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { generateMonthlyPlan } from "@/lib/server/plan";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { AnalysisResult } from "@/types";

function isAnalysisResult(payload: unknown): payload is AnalysisResult {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<AnalysisResult>;
  return Boolean(
    typeof candidate.region === "string" &&
      typeof candidate.ndvi === "number" &&
      typeof candidate.changePercent === "number" &&
      candidate.landUse &&
      typeof candidate.landUse === "object"
  );
}

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization") || "";
    const apiKey = auth.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || null;
    const client = await resolveApiClient(apiKey);
    if (!client) {
      const supabase = getSupabaseServer();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json(
          { error: "Unauthorized. Provide API key or sign in" },
          { status: 401 }
        );
      }
    }

    let rate: { ok: true; remaining: number } | { ok: false; retryAfterSec: number } | null = null;
    if (client) {
      rate = await checkRateLimit(`${client.keyId}:plan`, client.requestLimitPerMinute);
      if (!rate.ok) {
        return NextResponse.json({ error: "Rate limit exceeded", retryAfterSec: rate.retryAfterSec }, { status: 429 });
      }
    }

    const payload = (await request.json()) as { analysis?: unknown; months?: number; goal?: string };
    if (!isAnalysisResult(payload.analysis)) {
      return NextResponse.json({ error: "analysis object is required and must be a valid analysis result" }, { status: 400 });
    }

    const months = payload.months === 3 || payload.months === 6 || payload.months === 12 ? payload.months : 6;
    const goal = typeof payload.goal === "string" ? payload.goal.trim().slice(0, 250) : undefined;
    const plan = await generateMonthlyPlan(payload.analysis, months, goal);

    return NextResponse.json({ ...plan, meta: { apiVersion: "v1", plan: client ? client.plan : "free", remainingPerMinute: client ? (rate as any).remaining : null } }, { headers: client && rate ? { "x-rate-limit-remaining": String((rate as any).remaining), "x-api-plan": client.plan } : {} });
  } catch (error) {
    const err = error as unknown;
    if (err instanceof Error) {
      console.error("V1 plan error:", { name: err.name, message: err.message, stack: err.stack });
    } else {
      console.error("V1 plan error (non-Error):", err);
    }
    return NextResponse.json({ error: "Failed to generate monthly plan" }, { status: 500 });
  }
}
