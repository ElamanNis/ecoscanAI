import { NextRequest, NextResponse } from "next/server";
import { analyzeRegion } from "@/lib/gemini";
import { resolveApiClient } from "@/lib/server/auth";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { validateAnalysisRequest } from "@/lib/server/validation";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { SubscriptionTier } from "@/lib/supabase/types";

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
      const uid = session.user.id;
      const { data: profile } = await (supabase as any).from("profiles").select("id,subscription_tier").eq("id", uid).maybeSingle();
      const tier = ((profile as any)?.subscription_tier || "free") as SubscriptionTier;
      const limits: Record<SubscriptionTier, number> = { free: 5, standard: 50, premium: 1_000_000 };
      const now = new Date();
      const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      const { count } = await supabase
        .from("scans_history")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid)
        .gte("created_at", startOfMonth);
      if ((count || 0) >= limits[tier]) {
        return NextResponse.json({ error: "Monthly analysis limit reached" }, { status: 429 });
      }
    }

    let rate: { ok: true; remaining: number } | { ok: false; retryAfterSec: number } | null = null;
    if (client) {
      rate = await checkRateLimit(client.keyId, client.requestLimitPerMinute);
      if (!rate.ok) {
        return NextResponse.json(
          { error: "Rate limit exceeded", retryAfterSec: rate.retryAfterSec },
          { status: 429 }
        );
      }
    }

    const payload: unknown = await request.json();
    const parsed = validateAnalysisRequest(payload);
    if (!parsed.valid) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const result = await analyzeRegion(parsed.value);
    return NextResponse.json(
      { ...result, meta: { apiVersion: "v1", plan: client ? client.plan : "free", remainingPerMinute: client ? (rate as any).remaining : null } },
      {
        headers: {
          ...(client && rate ? { "x-rate-limit-remaining": String((rate as any).remaining), "x-api-plan": client.plan } : {}),
        },
      }
    );
  } catch (error) {
    console.error("V1 analyze error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
