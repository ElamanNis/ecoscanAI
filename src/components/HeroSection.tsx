"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

const STATS = [
  { key: "ha", target: 284500 },
  { key: "sources", target: 6 },
  { key: "accuracy", target: 96 },
  { key: "latency", target: 5 },
] as const;

export default function HeroSection() {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [values, setValues] = useState({ ha: 0, sources: 0, accuracy: 0, latency: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = 560;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.4,
      a: Math.random() * 0.6 + 0.15,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
    }));

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,200,255,${p.a})`;
        ctx.fill();
      });
      frame = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    const start = performance.now();
    const duration = 1400;
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / duration);
      setValues({
        ha: Math.floor(STATS[0].target * k),
        sources: Math.floor(STATS[1].target * k),
        accuracy: Math.floor(STATS[2].target * k),
        latency: Number((STATS[3].target * k).toFixed(1)),
      });
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section id="hero" className="relative overflow-hidden border-b border-[rgba(0,200,255,0.12)] pt-24">
      <canvas ref={canvasRef} className="absolute inset-x-0 top-0 h-[560px] w-full pointer-events-none" />
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="space-network" />
      <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-14 text-center">
        <span className="hud-badge">
          <span className="live-dot" /> {t("heroBadge")}
        </span>
        <h1 className="mt-7 font-['Syne'] text-5xl font-extrabold leading-tight text-[#f0f4f8] md:text-7xl">
          {t("heroTitle1")}
          <br />
          <span className="text-glow text-[#00c8ff]">{t("heroTitle2")}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-lg text-[#9cb2c2]">{t("heroText")}</p>

        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="#analyze" className="btn-primary px-8 py-4 text-base">
            {t("heroCtaAnalyze")}
          </Link>
          <Link href="#docs" className="btn-ghost px-8 py-4 text-base">
            {t("heroCtaDemo")}
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="card p-4 text-left">
            <p className="font-['JetBrains_Mono'] text-2xl font-bold text-[#00c8ff]">{values.ha.toLocaleString("en-US")}+</p>
            <p className="text-xs text-[#7f97a8]">{t("statHa")}</p>
          </div>
          <div className="card p-4 text-left">
            <p className="font-['JetBrains_Mono'] text-2xl font-bold text-[#00c8ff]">{values.sources}</p>
            <p className="text-xs text-[#7f97a8]">{t("statSources")}</p>
          </div>
          <div className="card p-4 text-left">
            <p className="font-['JetBrains_Mono'] text-2xl font-bold text-[#00c8ff]">{values.accuracy}%</p>
            <p className="text-xs text-[#7f97a8]">{t("statAccuracy")}</p>
          </div>
          <div className="card p-4 text-left">
            <p className="font-['JetBrains_Mono'] text-2xl font-bold text-[#00c8ff]">&lt; {Math.max(values.latency, 1)}s</p>
            <p className="text-xs text-[#7f97a8]">{t("statLatency")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
