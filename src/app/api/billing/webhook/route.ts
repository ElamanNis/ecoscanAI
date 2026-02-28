import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function mapTier(tier: string | null | undefined): "standard" | "premium" | "free" {
  if (tier === "premium") return "premium";
  if (tier === "standard") return "standard";
  return "free";
}

function toSubscriptionTier(tier: "standard" | "premium" | "free") {
  // maps to DB enum in src/lib/supabase/types.ts
  if (tier === "premium") return "premium";
  if (tier === "standard") return "standard";
  return "free";
}

function tierFromPriceId(priceId: string | null | undefined): "standard" | "premium" | "free" {
  if (!priceId) return "free";
  if (process.env.STRIPE_PRICE_PREMIUM && priceId === process.env.STRIPE_PRICE_PREMIUM) return "premium";
  if (process.env.STRIPE_PRICE_STANDARD && priceId === process.env.STRIPE_PRICE_STANDARD) return "standard";
  return "free";
}

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err) {
    console.error("stripe webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY missing; cannot process billing webhook");
    return NextResponse.json({ ok: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = (session.metadata?.userId || session.client_reference_id || "").toString();
      const tier = mapTier(session.metadata?.tier);
      const customerId = typeof session.customer === "string" ? session.customer : null;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;

      if (userId) {
        await (supabase as any)
          .from("profiles")
          .update({
            subscription_tier: toSubscriptionTier(tier),
            ...(customerId ? { stripe_customer_id: customerId } : {}),
            ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
          })
          .eq("id", userId);
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const subscriptionId = sub.id;
      const customerId = typeof sub.customer === "string" ? sub.customer : null;
      const priceId = sub.items.data[0]?.price?.id ?? null;
      const tier = event.type === "customer.subscription.deleted" ? "free" : tierFromPriceId(priceId);

      // update by subscription id if we have it, otherwise best-effort by customer id
      if (subscriptionId) {
        await (supabase as any)
          .from("profiles")
          .update({
            subscription_tier: toSubscriptionTier(tier),
            ...(customerId ? { stripe_customer_id: customerId } : {}),
            stripe_subscription_id: subscriptionId,
          })
          .eq("stripe_subscription_id", subscriptionId);
      } else if (customerId) {
        await (supabase as any)
          .from("profiles")
          .update({
            subscription_tier: toSubscriptionTier(tier),
            stripe_customer_id: customerId,
          })
          .eq("stripe_customer_id", customerId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("stripe webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
