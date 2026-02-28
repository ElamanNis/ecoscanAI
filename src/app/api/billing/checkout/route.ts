import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServer } from "@/lib/supabase/server";

type Plan = "standard" | "premium";

function getOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  return new URL(request.url).origin;
}

export async function POST(request: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const supabase = getSupabaseServer();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as { plan?: string };
    const plan = (body.plan === "standard" || body.plan === "premium" ? body.plan : null) as Plan | null;
    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const priceId =
      plan === "standard" ? process.env.STRIPE_PRICE_STANDARD : process.env.STRIPE_PRICE_PREMIUM;
    if (!priceId) return NextResponse.json({ error: "Stripe price is not configured" }, { status: 500 });

    const profileRes = await (supabase as any)
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", session.user.id)
      .maybeSingle();
    if (profileRes?.error) console.warn("profiles select failed (continuing):", profileRes.error.message);
    const profile = profileRes?.data as any;
    const stripeCustomerId = (profile as any)?.stripe_customer_id as string | null | undefined;

    const origin = getOrigin(request);
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/#pricing`,
      ...(stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: session.user.email || undefined }),
      client_reference_id: session.user.id,
      metadata: { userId: session.user.id, tier: plan },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    const e = err as any;
    const details = {
      name: e?.name,
      type: e?.type,
      code: e?.code,
      message: e?.message,
      statusCode: e?.statusCode,
    };
    console.error("billing/checkout error:", details);
    return NextResponse.json(
      { error: "Failed to create checkout session", details },
      { status: 500 }
    );
  }
}
