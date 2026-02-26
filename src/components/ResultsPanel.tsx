"use client";

import type { AnalysisResult, FullAnalysisResult } from "@/types";
import { useEffect, useState } from "react";
import DataSourceBadgeList from "./DataSourceBadgeList";
import ForecastPanel from "./ForecastPanel";

type Props = {
  result: AnalysisResult;
  onAskAI: () => void;
  onDownload: () => void;
  onCopy: () => void;
};

const RISK_COLOR: Record<string, string> = {
  Low: "#00ff87",
  Moderate: "#ffd60a",
  High: "#ff7043",
  Critical: "#ff3d57",
};

function f(value: number | null | undefined, digits = 1, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) return "n/a";
  return `${value.toFixed(digits)}${suffix}`;
}

function textValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "n/a";
  try {
    return JSON.stringify(value);
  } catch {
    return "n/a";
  }
}

function riskBar(score: number) {
  const clamped = Math.max(0, Math.min(100, score));
  return `${clamped}%`;
}

function flag(code: string) {
  if (!code || code.length !== 2) return "🌍";
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

function BasicFallback({ result }: { result: AnalysisResult }) {
  return (
    <div className="card p-4">
      <p className="mb-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#00c8ff]">Legacy View</p>
      <p className="text-sm text-[#cddde8]">NDVI {result.ndvi.toFixed(3)} ({result.ndviCategory})</p>
      <p className="text-sm text-[#8fa8b9]">Risk {result.riskLevel || "Moderate"} ({result.riskScore || 0}/100)</p>
      {result.geminiSummary && <p className="mt-2 text-sm text-[#9ec5d8]">{result.geminiSummary}</p>}
    </div>
  );
}

export default function ResultsPanel({ result, onAskAI, onDownload, onCopy }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const full = result.full as FullAnalysisResult | undefined;
  if (!full) return <BasicFallback result={result} />;
  if (!isMounted) {
    return (
      <div className="card p-4">
        <p className="text-sm text-[#90a8b8]">Loading…</p>
      </div>
    );
  }

  const insights = Array.isArray(full.gemini.insights)
    ? full.gemini.insights.map((x) => String(x))
    : typeof full.gemini.insights === "string"
      ? [full.gemini.insights]
      : [];

  const rawRecommendations = Array.isArray(full.gemini.recommendations) ? full.gemini.recommendations : [];
  const sortedRecommendations = [...rawRecommendations].sort((a, b) => {
    const w = { critical: 0, high: 1, medium: 2, low: 3 } as const;
    const ap = (a?.priority || "medium") as keyof typeof w;
    const bp = (b?.priority || "medium") as keyof typeof w;
    return w[ap] - w[bp];
  });

  const land = [
    ["Forest", full.landUse.forest, "#00ff87"],
    ["Agriculture", full.landUse.agriculture, "#ffd60a"],
    ["Urban", full.landUse.urban, "#a855f7"],
    ["Water", full.landUse.water, "#00c8ff"],
    ["Wetland", full.landUse.wetland, "#3ddc97"],
    ["Bare", full.landUse.bare, "#c4905a"],
  ] as const;

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#00c8ff]">Mission Report</p>
            <h3 className="font-['Syne'] text-xl font-bold text-white">
              {flag(full.location.countryCode)} {full.location.displayName}
            </h3>
            <p className="text-sm text-[#8ea5b6]">{textValue(full.gemini.headline)}</p>
            <p className="mt-1 text-xs text-[#6d8698]">{new Date(full.timestamp).toLocaleString()} | processing {full.processingMs} ms</p>
          </div>
          <div className="text-right">
            <div
              className="rounded-md border px-2 py-1 font-['JetBrains_Mono'] text-xs"
              style={{ borderColor: `${RISK_COLOR[full.risks.overall.level]}66`, color: RISK_COLOR[full.risks.overall.level] }}
            >
              {full.risks.overall.level} {full.risks.overall.score}/100
            </div>
            <p className="mt-1 text-xs text-[#8ea5b6]">{full.confidence}% confidence</p>
          </div>
        </div>
      </section>

      <section className="card p-4">
        <p className="mb-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#00c8ff]">AI Summary</p>
        {full.gemini.available ? (
          <p className="text-sm text-[#cde0ea]">{textValue(full.gemini.summary)}</p>
        ) : (
          <div className="rounded-lg border border-[rgba(255,61,87,0.3)] bg-[rgba(255,61,87,0.12)] p-3 text-sm text-[#ff9cb0]">
            AI unavailable: {full.gemini.error || "unknown error"}
          </div>
        )}
      </section>

      <section className="card p-4">
        <p className="mb-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#00c8ff]">Current Conditions</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#08121d] p-2">Temp {f(full.current.temperature)}C</div>
          <div className="rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#08121d] p-2">Feels {f(full.current.feelsLike)}C</div>
          <div className="rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#08121d] p-2">Humidity {f(full.current.humidity, 0)}%</div>
          <div className="rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#08121d] p-2">Wind {f(full.current.windSpeed)} km/h</div>
          <div className="rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#08121d] p-2">Cloud {f(full.current.cloudCover, 0)}%</div>
          <div className="rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#08121d] p-2">Pressure {f(full.current.pressure)} hPa</div>
          <div className="rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#08121d] p-2">Soil M {f(full.current.soilMoisture, 3)}</div>
          <div className="rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#08121d] p-2">Soil T {f(full.current.soilTemp)}C</div>
        </div>
      </section>

      <section className="card p-4">
        <p className="mb-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#00c8ff]">Environmental Indices</p>
        <div className="space-y-2">
          {[
            ["NDVI", full.indices.ndvi, 1, full.indices.ndviHealth.description],
            ["EVI", full.indices.evi, 1, ""],
            ["SAVI", full.indices.savi, 1, ""],
            ["NDWI", full.indices.ndwi, 1, ""],
          ].map(([label, val, max, note]) => (
            <div key={String(label)}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span>{label}</span>
                <span className="font-['JetBrains_Mono'] text-[#00c8ff]">{f(val as number, 3)}</span>
              </div>
              <div className="h-2 rounded-full bg-[#12202f]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#00ff87] to-[#00c8ff]" style={{ width: riskBar(((val as number) / (max as number)) * 100) }} />
              </div>
              {note && <p className="mt-1 text-[11px] text-[#8ca6b8]">{note}</p>}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-[#8ca6b8]">
          Drought {f(full.indices.droughtIndex, 2)}, LST {f(full.indices.lstProxy)}C, Carbon {f(full.indices.carbonProxy)} tC/ha
        </p>
      </section>

      <section className="card p-4">
        <p className="mb-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#00c8ff]">Risk Assessment</p>
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span>Overall</span>
            <span className="font-['JetBrains_Mono']">{full.risks.overall.score}/100</span>
          </div>
          <div className="h-2 rounded-full bg-[#12202f]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#00ff87] via-[#ffd60a] to-[#ff3d57]" style={{ width: riskBar(full.risks.overall.score) }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(full.risks.factors).map(([name, r]) => (
            <div key={name} className="rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#08121d] p-2 text-xs">
              <p className="font-semibold capitalize text-[#cfe1eb]">{name}</p>
              <p className="text-[#89a3b5]">{r.level} - {r.score}</p>
              <p className="text-[#6f8899]">{r.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <p className="mb-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#00c8ff]">Land Use Classification</p>
        <div className="space-y-2">
          {land.map(([label, value, color]) => (
            <div key={label}>
              <div className="mb-1 flex justify-between text-xs">
                <span>{label}</span>
                <span className="font-['JetBrains_Mono']">{value}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#12202f]">
                <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <p className="mb-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#00c8ff]">Climate History</p>
        <p className="text-sm text-[#d1e1ea]">
          {full.climate.period.start} to {full.climate.period.end} ({full.climate.period.days} days)
        </p>
        <p className="text-sm text-[#8ea7b8]">
          Temp {f(full.climate.temperature.avg)}C, max {f(full.climate.temperature.max)}C, min {f(full.climate.temperature.min)}C
        </p>
        <p className="text-sm text-[#8ea7b8]">
          Precip {f(full.climate.precipitation.total)} mm, solar {f(full.climate.solar.avg)} W/m2
        </p>
        <p className="text-sm text-[#8ea7b8]">
          Year comparison: precip {f(full.climate.precipitation.anomaly_pct)}%, temp {f(full.climate.temperature.anomaly)}C
        </p>
      </section>

      <ForecastPanel full={full} />

      <section className="card p-4">
        <p className="mb-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#00c8ff]">Satellite Intelligence</p>
        <p className="text-sm text-[#d3e4ed]">
          Scenes {full.satellite.totalScenes}, latest {full.satellite.latestDate || "n/a"}, avg cloud {f(full.satellite.avgCloudCover)}%
        </p>
        <p className="text-sm text-[#8ea7b8]">Best scene: {full.satellite.bestScene || "n/a"}</p>
        <div className="mt-2 space-y-1">
          {full.satellite.scenes.slice(0, 4).map((s) => (
            <div key={s.id} className="rounded-md border border-[rgba(255,255,255,0.07)] bg-[#08121d] px-2 py-1 text-xs text-[#9cb4c4]">
              {s.id} | {s.date} | cloud {f(s.cloudCoverPct)}% | {s.orbitDirection}
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <p className="mb-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#00c8ff]">Agricultural Advisory</p>
        {full.gemini.agriAdvisory ? (
          <div className="space-y-1 text-sm text-[#cde0ea]">
            <p>Soil: {textValue(full.gemini.agriAdvisory.soilCondition)}</p>
            <p>Irrigation: {textValue(full.gemini.agriAdvisory.irrigationAmount)}</p>
            <p>
              Best crops:{" "}
              {Array.isArray(full.gemini.agriAdvisory.bestCrops) && full.gemini.agriAdvisory.bestCrops.length
                ? full.gemini.agriAdvisory.bestCrops.join(", ")
                : "n/a"}
            </p>
            <p>
              Avoid crops:{" "}
              {Array.isArray(full.gemini.agriAdvisory.avoidCrops) && full.gemini.agriAdvisory.avoidCrops.length
                ? full.gemini.agriAdvisory.avoidCrops.join(", ")
                : "n/a"}
            </p>
            <p>Planting window: {textValue(full.gemini.agriAdvisory.plantingWindow)}</p>
            <p>Harvest outlook: {textValue(full.gemini.agriAdvisory.harvestOutlook)}</p>
            <p>Fertilizer: {textValue(full.gemini.agriAdvisory.fertilizerAdvice)}</p>
            <p>Pest risk: {textValue(full.gemini.agriAdvisory.pestRisk)}</p>
          </div>
        ) : (
          <p className="text-sm text-[#8fa7b8]">AI did not return agri advisory block.</p>
        )}
      </section>

      <section className="card p-4">
        <p className="mb-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#00c8ff]">AI Insights</p>
        <div className="space-y-1 text-sm text-[#cde0ea]">
          {insights.map((i, idx) => (
            <p key={idx}>
              <span className="mr-1 text-[#00c8ff]">›</span>
              {textValue(i)}
            </p>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <p className="mb-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#00c8ff]">Recommendations</p>
        <div className="space-y-1 text-sm">
          {sortedRecommendations.map((r, idx) => (
            <p key={idx} className="text-[#cde0ea]">
              <span className="font-['JetBrains_Mono'] uppercase text-[#00c8ff]">{r?.priority || "medium"}</span> {r?.action || "n/a"} | {r?.category || "general"} | {r?.timeframe || "n/a"}
            </p>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <p className="mb-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#00c8ff]">Water Resources</p>
        <p className="text-sm text-[#cde0ea]">
          NDWI {f(full.indices.ndwi, 3)}, soil moisture {f(full.current.soilMoisture, 3)}. {textValue(full.gemini.waterResourcesSummary)}
        </p>
      </section>

      <section className="card p-4">
        <p className="mb-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#00c8ff]">Climate Context</p>
        <p className="text-sm text-[#cde0ea]">
          Elevation {f(full.location.elevation, 0)} m, timezone {full.location.timezone}. {textValue(full.gemini.climateContext)}
        </p>
      </section>

      <section className="card p-4">
        <p className="mb-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#00c8ff]">Data Sources</p>
        <DataSourceBadgeList dataSources={full.dataSources} />
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={onDownload} className="btn-ghost px-3 py-2 text-xs">Download Full JSON</button>
          <button onClick={onCopy} className="btn-ghost px-3 py-2 text-xs">Copy JSON</button>
          <button onClick={onAskAI} className="btn-primary px-3 py-2 text-xs">Open in AI Chat</button>
        </div>
      </section>
    </div>
  );
}
