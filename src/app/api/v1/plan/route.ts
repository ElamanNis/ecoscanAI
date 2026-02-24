import { NextRequest, NextResponse } from "next/server";
import { resolveApiClient } from "@/lib/server/auth";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { generateMonthlyPlan } from "@/lib/server/plan";
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
    const apiKey = request.headers.get("authorization")?.replace("Bearer ", "").trim() || null;
    const client = await resolveApiClient(apiKey);
    if (!client) {
      return NextResponse.json(
        { error: "Unauthorized. Provide a valid API key in Authorization: Bearer <key>" },
        { status: 401 }
      );
    }

    const rate = await checkRateLimit(`${client.keyId}:plan`, client.requestLimitPerMinute);
    if (!rate.ok) {
      return NextResponse.json({ error: "Rate limit exceeded", retryAfterSec: rate.retryAfterSec }, { status: 429 });
    }

    const payload = (await request.json()) as { analysis?: unknown; months?: number; goal?: string };
    if (!isAnalysisResult(payload.analysis)) {
      return NextResponse.json({ error: "analysis object is required and must be a valid analysis result" }, { status: 400 });
    }

    const months = payload.months === 3 || payload.months === 6 || payload.months === 12 ? payload.months : 6;
    const goal = typeof payload.goal === "string" ? payload.goal.trim().slice(0, 250) : undefined;
    const plan = await generateMonthlyPlan(payload.analysis, months, goal);

    return NextResponse.json(
      { ...plan, meta: { apiVersion: "v1", plan: client.plan, remainingPerMinute: rate.remaining } },
      { headers: { "x-rate-limit-remaining": String(rate.remaining), "x-api-plan": client.plan } }
    );
  } catch (error) {
    console.error("V1 plan error:", error);
    return NextResponse.json({ error: "Failed to generate monthly plan" }, { status: 500 });
  }
}
