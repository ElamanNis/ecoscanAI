import { NextRequest, NextResponse } from "next/server";
import { analyzeRegion } from "@/lib/gemini";
import { resolveApiClient } from "@/lib/server/auth";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { validateAnalysisRequest } from "@/lib/server/validation";

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

    const rate = await checkRateLimit(client.keyId, client.requestLimitPerMinute);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfterSec: rate.retryAfterSec },
        { status: 429 }
      );
    }

    const payload: unknown = await request.json();
    const parsed = validateAnalysisRequest(payload);
    if (!parsed.valid) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const result = await analyzeRegion(parsed.value);
    return NextResponse.json(
      { ...result, meta: { apiVersion: "v1", plan: client.plan, remainingPerMinute: rate.remaining } },
      {
        headers: {
          "x-rate-limit-remaining": String(rate.remaining),
          "x-api-plan": client.plan,
        },
      }
    );
  } catch (error) {
    console.error("V1 analyze error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
