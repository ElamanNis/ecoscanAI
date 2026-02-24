"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function Navbar() {
  const { lang, setLang, t } = useI18n();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const links = [
    { label: t("navDashboard"), href: "#hero" },
    { label: t("navAnalyze"), href: "#analyze" },
    { label: t("navReports"), href: "#wow" },
    { label: t("navPricing"), href: "#pricing" },
    { label: t("navDocs"), href: "#docs" },
  ];

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 22);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all ${
        solid ? "bg-[#02070dcc] backdrop-blur-xl border-b border-[rgba(0,200,255,0.14)]" : ""
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="#hero" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg border border-[rgba(0,200,255,0.32)] bg-[rgba(0,200,255,0.08)] grid place-items-center">
            <span className="text-xs font-bold text-[#00c8ff]">S2</span>
          </div>
          <p className="font-['Syne'] text-xl font-bold text-white">
            Eco<span className="text-[#00c8ff]">Scan</span> AI
          </p>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-[#9cb2c2] hover:text-[#00c8ff]">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <div className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#08121d] p-1">
            {(["ru", "en", "kz"] as const).map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`rounded-md px-2 py-1 text-[11px] font-['JetBrains_Mono'] uppercase ${
                  lang === code ? "bg-[rgba(0,200,255,0.2)] text-[#00c8ff]" : "text-[#91a8b8]"
                }`}
              >
                {code}
              </button>
            ))}
          </div>
          <Link href="#docs" className="btn-primary px-5 py-2 text-sm">
            {t("navGetApi")}
          </Link>
        </div>

        <button className="text-[#9cb2c2] md:hidden" onClick={() => setOpen((v) => !v)} aria-label="menu">
          <span className="font-mono text-xs">{open ? t("close") : t("menu")}</span>
        </button>
      </div>

      {open && (
        <div className="border-b border-[rgba(0,200,255,0.14)] bg-[#02070de8] px-6 pb-4 pt-1 md:hidden">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block border-b border-[rgba(255,255,255,0.05)] py-2 text-sm text-[#9cb2c2]"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
