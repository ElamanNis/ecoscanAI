"use client";

import type { AnalysisRequest, AnalysisResult, PlanResponse } from "@/types";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import ChatPanel from "./ChatPanel";
import ResultsPanel from "./ResultsPanel";
import { useI18n } from "@/lib/i18n";

const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

const ANALYSES = [
  { id: "vegetation", label: "Vegetation (NDVI)" },
  { id: "deforestation", label: "Deforestation" },
  { id: "urban", label: "Urban Growth" },
  { id: "water", label: "Water Bodies" },
  { id: "agriculture", label: "Agricultural Health" },
  { id: "fire", label: "Fire Risk" },
  { id: "soil", label: "Soil Quality" },
  { id: "carbon", label: "Carbon Stock" },
] as const;

const RANGES = [
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 3 months" },
  { id: "180d", label: "Last 6 months" },
  { id: "365d", label: "Last 1 year" },
] as const;

const SATELLITES = [
  { id: "sentinel2", label: "Sentinel-2 (10m)" },
  { id: "landsat8", label: "Landsat-8 (30m)" },
  { id: "sentinel1", label: "Sentinel-1 SAR" },
  { id: "modis", label: "MODIS (250m)" },
] as const;

export default function AnalyzeSection() {
  const { t } = useI18n();
  const [region, setRegion] = useState("Almaty Region, Kazakhstan");
  const [analysisType, setAnalysisType] = useState<AnalysisRequest["analysisType"]>("vegetation");
  const [timeRange, setTimeRange] = useState<AnalysisRequest["timeRange"]>("30d");
  const [satellite, setSatellite] = useState<AnalysisRequest["satellite"]>("sentinel2");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [mode, setMode] = useState<"click" | "draw">("click");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [tab, setTab] = useState<"results" | "ai" | "spectral" | "plan">("results");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [planMonths, setPlanMonths] = useState<3 | 6 | 12>(6);
  const [planGoal, setPlanGoal] = useState("Increase yield and reduce drought risk");
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  const onMapClick = useCallback((lat: number, lon: number, place?: string) => {
    setCoords({ lat, lon });
    setRegion(place || `${lat.toFixed(4)}N, ${lon.toFixed(4)}E`);
  }, []);

  const onPolygonDraw = useCallback((points: number[][]) => {
    if (!points.length) return;
    const lat = points.reduce((s, p) => s + p[0], 0) / points.length;
    const lon = points.reduce((s, p) => s + p[1], 0) / points.length;
    setCoords({ lat, lon });
    setRegion(`Custom polygon (${lat.toFixed(3)}N, ${lon.toFixed(3)}E)`);
  }, []);

  const run = async () => {
    const steps = [t("stepFetch"), t("stepCompute"), t("stepAi"), t("stepFinal")];
    setError(null);
    setResult(null);
    setTab("results");
    setPlan(null);
    setLoading(true);
    setStep(0);
    try {
      for (let i = 0; i < steps.length; i++) {
        await new Promise((r) => setTimeout(r, 350));
        setStep(i + 1);
      }
      const req: AnalysisRequest = {
        region,
        coordinates: coords || undefined,
        analysisType,
        timeRange,
        satellite,
        notes: notes.trim() || undefined,
      };
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analyze request failed");
      setResult(data);
      if (data.full) {
        localStorage.setItem("ecoscan_latest_full", JSON.stringify(data.full));
        window.dispatchEvent(new CustomEvent("ecoscan:analysis-updated"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown analyze error");
    } finally {
      setLoading(false);
      setStep(0);
    }
  };

  const generatePlan = async () => {
    if (!result || planLoading) return;
    setPlanLoading(true);
    setPlanError(null);
    try {
      const res = await fetch("/api/v1/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer eco_pro_demo_key",
        },
        body: JSON.stringify({
          analysis: result,
          months: planMonths,
          goal: planGoal.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Plan request failed");
      setPlan(data);
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : "Plan generation failed");
    } finally {
      setPlanLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ecoscan-${Date.now()}.json`;
    a.click();
  };

  const tabs = useMemo(
    () => [
      { id: "results", label: t("tabResults") },
      { id: "ai", label: t("tabAi") },
      { id: "spectral", label: t("tabSpectral") },
      { id: "plan", label: t("tabPlan") },
    ] as const,
    [t],
  );

  const steps = [t("stepFetch"), t("stepCompute"), t("stepAi"), t("stepFinal")];

  return (
    <section id="analyze" className="py-20 grid-bg">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 text-center">
          <span className="hud-badge">
            <span className="live-dot" /> {t("analyzeBadge")}
          </span>
          <h2 className="mt-4 font-['Syne'] text-4xl font-bold text-white md:text-5xl">{t("analyzeTitle")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[#90a7b7]">
            {t("analyzeText")}
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-5">
          <div className="space-y-4 xl:col-span-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button onClick={() => setMode("click")} className={`rounded-lg border px-3 py-1 text-xs ${mode === "click" ? "border-[rgba(0,200,255,0.35)] text-[#00c8ff]" : "border-[rgba(255,255,255,0.1)] text-[#93a9b9]"}`}>{t("clickMode")}</button>
                <button onClick={() => setMode("draw")} className={`rounded-lg border px-3 py-1 text-xs ${mode === "draw" ? "border-[rgba(0,200,255,0.35)] text-[#00c8ff]" : "border-[rgba(255,255,255,0.1)] text-[#93a9b9]"}`}>{t("drawMode")}</button>
              </div>
              {coords && (
                <span className="rounded-lg border border-[rgba(0,200,255,0.22)] bg-[rgba(0,200,255,0.08)] px-3 py-1 font-['JetBrains_Mono'] text-xs text-[#00c8ff]">
                  {coords.lat.toFixed(3)}N, {coords.lon.toFixed(3)}E
                </span>
              )}
            </div>

            <div className="card h-[420px] overflow-hidden rounded-2xl">
              <MapComponent
                mode={mode}
                onMapClick={onMapClick}
                onPolygonDraw={onPolygonDraw}
                selectedCoords={coords}
                result={result}
                loading={loading}
              />
            </div>

            <div className="card space-y-4 p-5">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-[#7f95a7]">{t("regionLabel")}</label>
                  <input value={region} onChange={(e) => setRegion(e.target.value)} className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#08121d] px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#7f95a7]">{t("analysisType")}</label>
                  <select value={analysisType} onChange={(e) => setAnalysisType(e.target.value as AnalysisRequest["analysisType"])} className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#08121d] px-3 py-2 text-sm outline-none">
                    {ANALYSES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#7f95a7]">{t("timeRange")}</label>
                  <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as AnalysisRequest["timeRange"])} className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#08121d] px-3 py-2 text-sm outline-none">
                    {RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#7f95a7]">{t("satelliteSource")}</label>
                  <select value={satellite} onChange={(e) => setSatellite(e.target.value as AnalysisRequest["satellite"])} className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#08121d] px-3 py-2 text-sm outline-none">
                    {SATELLITES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#7f95a7]">{t("goalLabel")}</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#08121d] px-3 py-2 text-sm outline-none" placeholder={t("goalPlaceholder")} />
              </div>

              <button onClick={run} disabled={loading || !region.trim()} className="btn-primary w-full py-3 text-sm">
                {loading ? t("runningAnalysis") : t("runAnalysis")}
              </button>

              {loading && (
                <div className="space-y-2">
                  {steps.map((s, i) => (
                    <div key={s} className="flex items-center gap-2 text-xs">
                      <span className={`h-2 w-2 rounded-full ${i < step ? "bg-[#00ff87]" : "bg-[#334b5a]"}`} />
                      <span className={i < step ? "text-[#9edab9]" : "text-[#7b93a4]"}>{s}</span>
                    </div>
                  ))}
                  <div className="h-1 rounded-full bg-[#132332]">
                    <div className="h-full rounded-full bg-[#00c8ff]" style={{ width: `${(step / steps.length) * 100}%`, transition: "width 300ms ease" }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 xl:col-span-2">
            <div className="card flex gap-1 p-1">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 rounded-lg px-2 py-2 text-xs ${tab === t.id ? "bg-[rgba(0,200,255,0.15)] text-[#00c8ff]" : "text-[#8ea5b6]"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="card min-h-[640px] p-4">
              {error && <p className="rounded-lg border border-[rgba(255,61,87,0.3)] bg-[rgba(255,61,87,0.12)] p-3 text-sm text-[#ff9cb0]">{error}</p>}

              {tab === "results" && result && (
                <ResultsPanel result={result} onAskAI={() => setTab("ai")} onDownload={downloadResult} onCopy={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))} />
              )}
              {tab === "results" && !result && !error && (
                <p className="text-sm text-[#90a8b8]">{t("emptyResults")}</p>
              )}

              {tab === "ai" && <ChatPanel result={result} />}

              {tab === "spectral" && (
                <div className="space-y-3">
                  {result ? (
                    <>
                      <p className="font-['JetBrains_Mono'] text-xs uppercase tracking-[0.2em] text-[#00c8ff]">Spectral and model data</p>
                      {result.spectralBands.map((b) => (
                        <div key={b.name}>
                          <div className="mb-1 flex justify-between text-xs">
                            <span>{b.name}</span>
                            <span className="font-['JetBrains_Mono'] text-[#00c8ff]">{b.value.toFixed(4)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-[#142231]">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#00c8ff] to-[#00ff87]" style={{ width: `${Math.min(100, b.value * 320)}%` }} />
                          </div>
                        </div>
                      ))}
                      <div className="rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#08121d] p-3 text-xs text-[#97afbf]">
                        NDVI = (NIR - Red) / (NIR + Red) = {result.ndvi.toFixed(4)} ({result.ndviCategory})
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-[#90a8b8]">{t("noSpectral")}</p>
                  )}
                </div>
              )}

              {tab === "plan" && (
                <div className="space-y-3">
                  <p className="font-['JetBrains_Mono'] text-xs uppercase tracking-[0.2em] text-[#00c8ff]">{t("actionPlan")}</p>
                  <div className="flex gap-2">
                    {[3, 6, 12].map((m) => (
                      <button key={m} onClick={() => setPlanMonths(m as 3 | 6 | 12)} className={`rounded-lg border px-3 py-1 text-xs ${planMonths === m ? "border-[rgba(0,200,255,0.35)] text-[#00c8ff]" : "border-[rgba(255,255,255,0.1)] text-[#93a9b9]"}`}>
                        {m} months
                      </button>
                    ))}
                  </div>
                  <input value={planGoal} onChange={(e) => setPlanGoal(e.target.value)} className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#08121d] px-3 py-2 text-sm outline-none" />
                  <button onClick={generatePlan} disabled={!result || planLoading} className="btn-primary w-full py-2 text-sm">
                    {planLoading ? t("generating") : t("generatePlan")}
                  </button>
                  {planError && <p className="text-sm text-[#ff9cb0]">{planError}</p>}
                  {plan && (
                    <div className="space-y-2">
                      <p className="text-sm text-[#cde0ea]">{plan.summary}</p>
                      {plan.plans.map((p, idx) => (
                        <article key={idx} className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#08121d] p-3">
                          <p className="font-['JetBrains_Mono'] text-xs text-[#00c8ff]">{p.month} - {p.riskLevel}</p>
                          <p className="text-sm text-[#d0e0ea]">{p.objective}</p>
                          <ul className="mt-1 list-disc pl-4 text-xs text-[#92aab9]">
                            {p.actions.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                          <p className="mt-1 text-xs text-[#6f8899]">KPI: {p.kpi}</p>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
