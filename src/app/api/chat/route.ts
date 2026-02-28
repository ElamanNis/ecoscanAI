import { NextRequest, NextResponse } from "next/server";
import { generateTextWithFallback } from "@/lib/server/ai";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ reply: "Пожалуйста, войдите чтобы использовать чат-помощника." }, { status: 401 });
    }
    const { message, context, history } = await request.json();
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });
    if (!context?.trim()) {
      return NextResponse.json({ reply: "Please run an analysis first. Click the map and hit Launch." });
    }
    const ai = await generateTextWithFallback(message, context, Array.isArray(history) ? history : []);
    if (!ai.ok) {
      const local = (() => {
        try {
          const obj = JSON.parse(context);
          const ndvi = obj?.ndvi;
          const ndviCat = obj?.ndviCategory || obj?.indices?.ndviHealth?.category;
          const land = obj?.landUse || obj?.full?.landUse;
          const parts: string[] = [];
          if (typeof ndvi === "number") parts.push(`NDVI: ${ndvi.toFixed(3)} (${ndviCat || "n/a"})`);
          if (land) {
            parts.push(`Land use: forest ${land.forest}% | agriculture ${land.agriculture}% | urban ${land.urban}% | water ${land.water}%`);
          }
          parts.push("Recommendation: Maintain soil moisture, monitor weekly NDVI, and prioritize low‑NDVI zones.");
          return parts.join(" — ");
        } catch {
          return "Local advisory: Monitor NDVI weekly, ensure irrigation balance, and track fire/flood risks.";
        }
      })();
      return NextResponse.json({ reply: local, provider: "local" });
    }
    return NextResponse.json({ reply: ai.text, provider: ai.provider });
  } catch (error) {
    return NextResponse.json({ reply: "Local advisory: Monitor NDVI weekly and adjust irrigation; AI temporarily unavailable.", provider: "local" });
  }
}
