"use client";

import { useI18n } from "@/lib/i18n";

const FEATURES = [
  { title: "NDVI Analysis", desc: "Vegetation health index with calibrated proxy modeling.", tone: "#00ff87" },
  { title: "Fire Detection", desc: "Heat and dryness risk from climate and wind factors.", tone: "#ff7043" },
  { title: "Water Monitoring", desc: "Water stress, flood potential, and moisture trends.", tone: "#00c8ff" },
  { title: "Crop Health", desc: "Actionable farming advisory with irrigation guidance.", tone: "#ffd60a" },
  { title: "Urban Sprawl", desc: "Built-up pressure in mixed land-use regions.", tone: "#a855f7" },
  { title: "Deforestation Alerts", desc: "Track scene-level changes and cloud-filtered passes.", tone: "#ff3d57" },
];

export default function FeaturesSection() {
  const { t } = useI18n();
  return (
    <section id="features" className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center font-['JetBrains_Mono'] text-xs uppercase tracking-[0.3em] text-[#00c8ff]">Features</p>
        <h2 className="mt-3 text-center font-['Syne'] text-4xl font-bold text-white md:text-5xl">{t("featuresTitle")}</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, idx) => (
            <article key={f.title} className="card p-5 fade-up" style={{ animationDelay: `${idx * 70}ms` }}>
              <div className="mb-3 h-1 w-12 rounded-full" style={{ background: f.tone }} />
              <h3 className="font-['Syne'] text-xl font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-[#93a9b9]">{f.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

