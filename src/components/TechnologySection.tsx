"use client";

import { useI18n } from "@/lib/i18n";

const STEPS = [
  { step: "01", title: "Point Selection", desc: "User selects a map point or polygon footprint." },
  { step: "02", title: "Real API Fetch", desc: "NASA, Open-Meteo, Copernicus, Nominatim, and elevation services queried in parallel." },
  { step: "03", title: "Index Modeling", desc: "Empirical vegetation and drought proxies are computed from real inputs." },
  { step: "04", title: "AI Interpretation", desc: "AI provider returns structured advisory and recommendations." },
  { step: "05", title: "Action Output", desc: "Report, risk scores, forecast dashboard, and planning context are returned." },
];

export default function TechnologySection() {
  const { t } = useI18n();
  return (
    <section id="technology" className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center font-['JetBrains_Mono'] text-xs uppercase tracking-[0.3em] text-[#00c8ff]">Technology</p>
        <h2 className="mt-3 text-center font-['Syne'] text-4xl font-bold text-white md:text-5xl">
          {t("technologyTitle")}
        </h2>

        <div className="mt-10 grid gap-3 md:grid-cols-5">
          {STEPS.map((s) => (
            <article key={s.step} className="card p-4">
              <p className="font-['JetBrains_Mono'] text-xs text-[#00c8ff]">{s.step}</p>
              <h3 className="mt-1 font-['Syne'] text-lg font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-[#90a8b8]">{s.desc}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 card p-4">
          <p className="font-['JetBrains_Mono'] text-xs uppercase tracking-[0.2em] text-[#00c8ff]">Architecture</p>
          <p className="mt-2 text-sm text-[#cddfe9]">
            Satellite and climate APIs to Analyze API to Risk engine to AI layer to Results and plan APIs to External clients.
          </p>
        </div>
      </div>
    </section>
  );
}
