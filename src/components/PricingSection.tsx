"use client";

import { useI18n } from "@/lib/i18n";

const PLANS = [
  { name: "Free", price: "$0/mo", desc: "5 analyses per month, basic NDVI", featured: false },
  { name: "Standard", price: "$20/mo", desc: "50 analyses, full spectral, scan history", featured: true },
  { name: "Premium", price: "$100/mo", desc: "Unlimited, priority AI, export PDF reports", featured: false },
];

export default function PricingSection() {
  const { t } = useI18n();
  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center font-['JetBrains_Mono'] text-xs uppercase tracking-[0.3em] text-[#00c8ff]">Pricing</p>
        <h2 className="mt-3 text-center font-['Syne'] text-4xl font-bold text-white md:text-5xl">{t("pricingTitle")}</h2>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`card p-5 ${plan.featured ? "border-[rgba(0,200,255,0.35)] bg-[rgba(0,200,255,0.06)] md:scale-105" : ""}`}
            >
              {plan.featured && (
                <span className="mb-2 inline-block rounded-full bg-[#00c8ff] px-3 py-1 text-xs font-bold text-[#021018]">Most Popular</span>
              )}
              <h3 className="font-['Syne'] text-2xl font-bold text-white">{plan.name}</h3>
              <p className="mt-1 font-['JetBrains_Mono'] text-xl text-[#00c8ff]">{plan.price}</p>
              <p className="mt-2 text-sm text-[#93acbc]">{plan.desc}</p>
              <button className={`mt-5 w-full py-2 text-sm ${plan.featured ? "btn-primary" : "btn-ghost"}`} onClick={() => location.assign("/register")}>
                {plan.name === "Premium" ? "Upgrade" : "Get Started"}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
