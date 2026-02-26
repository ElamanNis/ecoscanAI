import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { SubscriptionTier } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();
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
      hypothesisId: "H3",
      location: "src/app/api/me/route.ts:GET",
      message: "me route session check",
      data: {
        hasSession: !!session,
        hasUser: !!session?.user,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { data: profile } = await (supabase as any).from("profiles").select("id,full_name,subscription_tier,api_usage_count").eq("id", userId).maybeSingle();
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const { count } = await (supabase as any)
    .from("scans_history")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth);
  const tier = ((profile as any)?.subscription_tier || "free") as SubscriptionTier;
  const limits: Record<SubscriptionTier, number> = { free: 5, standard: 50, premium: 1_000_000 };
  return NextResponse.json({
    userId,
    email: session.user.email,
    fullName: profile?.full_name || null,
    tier,
    monthlyUsage: count ?? 0,
    monthlyLimit: limits[tier],
  });
}
