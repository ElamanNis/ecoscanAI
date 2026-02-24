import type { FullAnalysisResult } from "@/types";

function fmt(v: number | null | undefined, d = 1) {
  if (v === null || v === undefined || Number.isNaN(v)) return "n/a";
  return v.toFixed(d);
}

export default function ForecastPanel({ full }: { full: FullAnalysisResult }) {
  return (
    <div className="card p-4">
      <p className="mb-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#00c8ff]">7-Day Forecast</p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {full.forecast.days.slice(0, 7).map((d) => (
          <div key={d.date} className="rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#08121d] p-2">
            <p className="text-[11px] text-[#90a6b7]">{new Date(d.date).toLocaleDateString(undefined, { weekday: "short" })}</p>
            <p className="font-['JetBrains_Mono'] text-sm text-[#00c8ff]">
              {fmt(d.tempMax)} / {fmt(d.tempMin)}C
            </p>
            <p className="text-[11px] text-[#90a6b7]">Rain {fmt(d.precipSum)} mm</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-[#8ba4b6]">
        Weekly precipitation {fmt(full.forecast.weeklyTotal.precipitation)} mm, ET0 {fmt(full.forecast.weeklyTotal.totalET0)} mm
      </p>
    </div>
  );
}
