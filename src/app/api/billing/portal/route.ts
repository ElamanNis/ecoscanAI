import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServer } from "@/lib/supabase/server";

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
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", session.user.id)
      .maybeSingle();
    const storedCustomerId = (profile as any)?.stripe_customer_id as string | null | undefined;

    const customer = storedCustomerId
      ? await stripe.customers.retrieve(storedCustomerId).catch(() => null)
      : null;

    let customerId = (customer && !("deleted" in customer) ? customer.id : null) as string | null;

    if (!customerId) {
      const customers = await stripe.customers.list({ email: session.user.email, limit: 1 });
      const byEmail = customers.data[0];
      if (!byEmail) {
        return NextResponse.json({ error: "Stripe customer not found. Please upgrade first." }, { status: 400 });
      }
      customerId = byEmail.id;
      await (supabase as any).from("profiles").update({ stripe_customer_id: customerId }).eq("id", session.user.id);
    }

    const origin = getOrigin(request);
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error("billing/portal error:", err);
    return NextResponse.json({ error: "Failed to create billing portal session" }, { status: 500 });
  }
}
