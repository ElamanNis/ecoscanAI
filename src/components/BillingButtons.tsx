"use client";

import Link from "next/link";
import { useState } from "react";

export default function BillingButtons({ tier }: { tier: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPortal = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data.error || "Billing portal failed");
      if (data.url) location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Billing portal failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Link href="/#pricing" className="rounded-lg border border-[rgba(0,200,255,0.2)] px-3 py-1 text-sm text-[#00c8ff]">
          Обновить план
        </Link>
        {tier !== "free" && (
          <button
            onClick={openPortal}
            disabled={loading}
            className="rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-1 text-sm text-[#cfe0ea]"
          >
            {loading ? "Открываем..." : "Управлять подпиской"}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-[#ff9cb0]">{error}</p>}
    </div>
  );
}

