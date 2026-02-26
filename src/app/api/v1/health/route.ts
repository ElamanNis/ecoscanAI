import { NextResponse } from "next/server";
import { getDbStatus } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDbStatus();
  return NextResponse.json({
    status: "ok",
    service: "EcoScan AI Public API",
    version: "v1",
    auth: "Bearer API key",
    endpoints: ["/api/v1/analyze", "/api/v1/plan", "/api/v1/keys", "/api/v1/health"],
    ai: {
      groq: process.env.GROQ_API_KEY ? "configured" : "missing",
      huggingface: process.env.HUGGINGFACE_API_KEY ? "configured" : "missing",
    },
    db,
    timestamp: new Date().toISOString(),
  });
}
