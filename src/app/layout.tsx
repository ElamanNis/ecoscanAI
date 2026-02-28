import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "EcoScan AI - Satellite Earth Intelligence",
  description: "Production-grade satellite intelligence platform powered by real APIs and multi-AI.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body>
        <div className="site-bg" aria-hidden />
        <I18nProvider>
          <div className="app-shell">{children}</div>
        </I18nProvider>
      </body>
    </html>
  );
}
