import { NextResponse } from "next/server";
import { getDbStatus } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDbStatus();
  return NextResponse.json({
    status: "ok",
    service: "EcoScan AI",
    version: "1.1.0",
    api: {
      internal: ["/api/analyze", "/api/chat", "/api/health"],
      public: ["/api/v1/analyze", "/api/v1/plan", "/api/v1/keys", "/api/v1/health"],
    },
    ai: {
      groq: process.env.GROQ_API_KEY ? "configured" : "missing",
      huggingface: process.env.HUGGINGFACE_API_KEY ? "configured" : "missing",
    },
    billing: {
      stripeSecret: process.env.STRIPE_SECRET_KEY ? "configured" : "missing",
      stripeWebhook: process.env.STRIPE_WEBHOOK_SECRET ? "configured" : "missing",
      priceStandard: process.env.STRIPE_PRICE_STANDARD ? "configured" : "missing",
      pricePremium: process.env.STRIPE_PRICE_PREMIUM ? "configured" : "missing",
      supabaseServiceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ? "configured" : "missing",
    },
    db,
    timestamp: new Date().toISOString(),
  });
}
