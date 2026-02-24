"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

const SNIPPETS: Record<string, string> = {
  Python: `import requests

response = requests.post(
    "https://api.ecoscan.ai/v1/analyze",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={
        "coordinates": {"lat": 51.18, "lon": 71.44},
        "radius_km": 50,
        "analysis_type": "vegetation",
        "time_range": "30d"
    }
)
data = response.json()
print(data["ndvi_score"])`,
  JavaScript: `const response = await fetch("/api/v1/analyze", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_API_KEY"
  },
  body: JSON.stringify({
    region: "Astana, Kazakhstan",
    analysisType: "vegetation",
    timeRange: "30d",
    satellite: "sentinel2"
  })
});
const data = await response.json();`,
  cURL: `curl -X POST "https://api.ecoscan.ai/v1/analyze" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"coordinates":{"lat":51.18,"lon":71.44},"analysis_type":"vegetation","time_range":"30d"}'`,
  R: `library(httr)
library(jsonlite)

res <- POST(
  "https://api.ecoscan.ai/v1/analyze",
  add_headers(Authorization = "Bearer YOUR_API_KEY"),
  content_type_json(),
  body = toJSON(list(region="Astana, Kazakhstan",analysisType="vegetation"), auto_unbox = TRUE)
)`,
};

export default function DocsSection() {
  const { t } = useI18n();
  const [tab, setTab] = useState<keyof typeof SNIPPETS>("Python");
  return (
    <section id="docs" className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-center font-['JetBrains_Mono'] text-xs uppercase tracking-[0.3em] text-[#00c8ff]">API Documentation</p>
        <h2 className="mt-3 text-center font-['Syne'] text-4xl font-bold text-white">{t("docsTitle")}</h2>

        <div className="card mt-8 overflow-hidden">
          <div className="flex gap-2 border-b border-[rgba(255,255,255,0.06)] p-3">
            {Object.keys(SNIPPETS).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key as keyof typeof SNIPPETS)}
                className={`rounded-lg px-3 py-1 text-xs ${tab === key ? "bg-[rgba(0,200,255,0.15)] text-[#00c8ff]" : "text-[#93a9b9]"}`}
              >
                {key}
              </button>
            ))}
          </div>
          <pre className="overflow-x-auto p-5 font-['JetBrains_Mono'] text-xs leading-relaxed text-[#b9cddd]">{SNIPPETS[tab]}</pre>
        </div>
      </div>
    </section>
  );
}
