import AnalyzeSection from "@/components/AnalyzeSection";
import DocsSection from "@/components/DocsSection";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import Navbar from "@/components/Navbar";
import PricingSection from "@/components/PricingSection";
import TechnologySection from "@/components/TechnologySection";
import WowFeaturesSection from "@/components/WowFeaturesSection";

export default function Home() {
  return (
    <main className="space-root">
      <Navbar />
      <HeroSection />
      <div className="section-divider" />
      <FeaturesSection />
      <div className="section-divider" />
      <AnalyzeSection />
      <div className="section-divider" />
      <WowFeaturesSection />
      <div className="section-divider" />
      <TechnologySection />
      <div className="section-divider" />
      <PricingSection />
      <div className="section-divider" />
      <DocsSection />
      <Footer />
    </main>
  );
}
