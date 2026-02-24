"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-[rgba(255,255,255,0.07)] bg-[#02070d] py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <div>
          <p className="font-['Syne'] text-xl font-bold text-white">
            Eco<span className="text-[#00c8ff]">Scan</span> AI
          </p>
          <p className="text-xs text-[#8ca4b5]">{t("footerTagline")}</p>
        </div>
        <p className="text-center text-xs text-[#6f8697]">{t("footerBuilt")}</p>
        <div className="flex gap-4 text-sm text-[#93a9b9]">
          <Link href="#pricing">Product</Link>
          <Link href="#docs">Developers</Link>
          <Link href="#hero">Company</Link>
          <Link href="#hero">Legal</Link>
        </div>
      </div>
    </footer>
  );
}
