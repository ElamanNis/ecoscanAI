"use client";

import type { FullAnalysisResult } from "@/types";
import { useEffect, useMemo, useState } from "react";
import DataSourceBadgeList from "./DataSourceBadgeList";
import { useI18n } from "@/lib/i18n";

const ALERTS = [
  "[FIRE] Amazon Basin: fire risk up 12%",
  "[FLOOD] Mekong: flood pressure elevated",
  "[DROUGHT] Horn of Africa: drought signal high",
  "[FOREST] Congo: canopy decline detected",
  "[WATER] Aral zone: moisture reduction",
  "[URBAN] Metro growth pressure increasing",
  "[HEAT] Steppe belt: heat anomaly +2.1C",
  "[SOIL] Salinity risk moderate",
];

function useLatestAnalysis() {
  const [latest, setLatest] = useState<FullAnalysisResult | null>(null);
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem("ecoscan_latest_full");
        if (!raw) return setLatest(null);
        setLatest(JSON.parse(raw) as FullAnalysisResult);
      } catch {
        setLatest(null);
      }
    };
    load();
    window.addEventListener("ecoscan:analysis-updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("ecoscan:analysis-updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);
  return latest;
}

export default function WowFeaturesSection() {
  const { t } = useI18n();
  const [feedIndex, setFeedIndex] = useState(0);
  const [counters, setCounters] = useState({ ha: 284500, alerts: 1847, countries: 195 });
  const [slider, setSlider] = useState(55);
  const latest = useLatestAnalysis();

  useEffect(() => {
    const t = setInterval(() => setFeedIndex((v) => (v + 1) % ALERTS.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setCounters((p) => ({ ha: p.ha + 120, alerts: p.alerts + (Math.random() > 0.65 ? 1 : 0), countries: 195 }));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const visibleAlerts = useMemo(() => {
    const out = [];
    for (let i = 0; i < 4; i++) out.push(ALERTS[(feedIndex + i) % ALERTS.length]);
    return out;
  }, [feedIndex]);

  return (
    <section id="wow" className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center font-['JetBrains_Mono'] text-xs uppercase tracking-[0.3em] text-[#00c8ff]">Live Intelligence</p>
        <h2 className="mt-3 text-center font-['Syne'] text-4xl font-bold text-white md:text-5xl">{t("wowTitle")}</h2>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="card p-4">
            <p className="font-['JetBrains_Mono'] text-xs uppercase tracking-[0.2em] text-[#00c8ff]">Live Alerts</p>
            <div className="mt-2 space-y-2 text-sm text-[#cde0ea]">
              {visibleAlerts.map((a, i) => (
                <p key={i} className="rounded-md border border-[rgba(255,255,255,0.07)] bg-[#08121d] px-2 py-1">
                  {a}
                </p>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <p className="font-['JetBrains_Mono'] text-xs uppercase tracking-[0.2em] text-[#00c8ff]">Global Counters</p>
            <p className="mt-2 text-sm text-[#cde0ea]">ha analyzed: {counters.ha.toLocaleString("en-US")}</p>
            <p className="text-sm text-[#cde0ea]">active alerts: {counters.alerts.toLocaleString("en-US")}</p>
            <p className="text-sm text-[#cde0ea]">countries monitored: {counters.countries}</p>
          </div>

          <div className="card p-4">
            <p className="font-['JetBrains_Mono'] text-xs uppercase tracking-[0.2em] text-[#00c8ff]">Before / After NDVI</p>
            <div
              className="mt-2 h-28 overflow-hidden rounded-lg border border-[rgba(255,255,255,0.07)]"
              onMouseMove={(e) => {
                const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const pct = ((e.clientX - r.left) / r.width) * 100;
                setSlider(Math.max(0, Math.min(100, pct)));
              }}
            >
              <div className="relative h-full bg-gradient-to-r from-[#1f4b2c] to-[#0c2d17]">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#3b1f1f] to-[#3f2a14]" style={{ width: `${slider}%` }} />
                <div className="absolute inset-y-0 w-[2px] bg-[#00c8ff]" style={{ left: `${slider}%` }} />
              </div>
            </div>
            <p className="mt-2 text-xs text-[#90a8b8]">2022 NDVI 0.68 | 2024 NDVI 0.41</p>
          </div>
        </div>

        <div className="card mt-4 p-4">
          <p className="mb-2 font-['JetBrains_Mono'] text-xs uppercase tracking-[0.2em] text-[#00c8ff]">API Status Dashboard</p>
          {latest ? <DataSourceBadgeList dataSources={latest.dataSources} /> : <p className="text-sm text-[#90a8b8]">Run analysis to display live API status.</p>}
        </div>
      </div>
    </section>
  );
}
