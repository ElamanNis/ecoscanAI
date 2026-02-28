"use client";

import type { AnalysisResult } from "@/types";
import { useEffect, useMemo, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatPanel({ result }: { result: AnalysisResult | null }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Run an analysis first, then ask questions about risks, crops, water, or forecast." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const quick = useMemo(() => {
    if (!result) return ["What is NDVI?", "How accurate is this report?", "What data sources are used?"];
    if (result.analysisType === "agriculture") return ["Water stress?", "Best crops?", "Fertilizer advice?"];
    if (result.analysisType === "deforestation") return ["Forest loss trend?", "Main risk now?", "Recovery plan?"];
    if (result.analysisType === "water") return ["Flood risk?", "Drought risk?", "Irrigation advice?"];
    return ["Explain NDVI", "Main risks", "Actions for this month"];
  }, [result]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!result) return;
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Analysis ready for ${result.region}. NDVI ${result.ndvi.toFixed(3)}, risk ${result.riskLevel || "Moderate"}. Ask anything.`,
      },
    ]);
  }, [result]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          context: JSON.stringify(result?.full || result || {}),
          history: messages.slice(-8),
        }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data.reply || data.error || "Chat failed");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "No response." }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: e instanceof Error ? e.message : "AI unavailable." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 320 }}>
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl border px-3 py-2 text-xs leading-relaxed ${
                m.role === "user"
                  ? "border-[rgba(168,85,247,0.28)] bg-[rgba(168,85,247,0.12)] text-[#e8daf8]"
                  : "border-[rgba(0,200,255,0.18)] bg-[rgba(0,200,255,0.08)] text-[#d1ecf7]"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <p className="text-xs text-[#8ca3b4]">AI is thinking...</p>}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {quick.map((q) => (
          <button key={q} onClick={() => setInput(q)} className="rounded-lg border border-[rgba(0,200,255,0.2)] px-2 py-1 text-xs text-[#91b5ca]">
            {q}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask AI with current analysis context"
          className="w-full rounded-xl border border-[rgba(0,200,255,0.18)] bg-[#07111c] px-3 py-2 text-sm text-[#d9e7ef] outline-none"
        />
        <button onClick={send} disabled={loading || !input.trim()} className="btn-primary px-4 py-2 text-sm">
          Send
        </button>
      </div>
    </div>
  );
}
