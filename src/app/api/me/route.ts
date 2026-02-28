import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { SubscriptionTier } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  let profile: any = null;
  try {
    const profileRes = await (supabase as any)
      .from("profiles")
      .select("id,full_name,subscription_tier,api_usage_count")
      .eq("id", userId)
      .maybeSingle();
    if (profileRes?.error) console.warn("me: profiles select failed:", profileRes.error.message);
    profile = profileRes?.data ?? null;
  } catch (e) {
    console.warn("me: profiles select threw:", e);
  }

  // If trigger didn't create profile yet, try to create it with the user's session (RLS allows insert where id=auth.uid()).
  if (!profile) {
    try {
      const insertRes = await (supabase as any)
        .from("profiles")
        .insert({ id: userId, full_name: null, subscription_tier: "free", api_usage_count: 0 })
        .select("id,full_name,subscription_tier,api_usage_count")
        .maybeSingle();
      if (insertRes?.error) console.warn("me: profiles insert failed (continuing):", insertRes.error.message);
      profile = insertRes?.data ?? null;
    } catch (e) {
      console.warn("me: profiles insert threw (continuing):", e);
    }
  }
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  let count = 0;
  try {
    const countRes = await (supabase as any)
      .from("scans_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth);
    if (countRes?.error) console.warn("me: scans_history count failed:", countRes.error.message);
    count = (countRes?.count ?? 0) as number;
  } catch (e) {
    console.warn("me: scans_history count threw:", e);
  }

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
