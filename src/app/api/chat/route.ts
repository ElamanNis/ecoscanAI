import { NextRequest, NextResponse } from "next/server";
import { generateTextWithFallback } from "@/lib/server/ai";

export async function POST(request: NextRequest) {
  try {
    const { message, context, history } = await request.json();
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });
    if (!context?.trim()) {
      return NextResponse.json({ reply: "Please run an analysis first. Click the map and hit Launch." });
    }
    const ai = await generateTextWithFallback(message, context, Array.isArray(history) ? history : []);
    if (!ai.ok) {
      return NextResponse.json(
        { reply: `AI unavailable: ${ai.error || "unknown error"}` },
        { status: 503 }
      );
    }
    return NextResponse.json({ reply: ai.text, provider: ai.provider });
  } catch (error) {
    return NextResponse.json(
      { reply: `AI unavailable: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 503 }
    );
  }
}
