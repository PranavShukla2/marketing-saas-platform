"use client";

import FloatingFlo from "../../components/landing/FloatingFlo";
import ConfluenceHero from "../../components/landing/ConfluenceHero";
import InsightCards from "../../components/landing/InsightCards";
import IntegrationsMarquee from "../../components/landing/IntegrationsMarquee";
import PhoneChat from "../../components/landing/PhoneChat";
import BentoFeatures from "../../components/landing/BentoFeatures";
import PinnedShowcase from "../../components/landing/PinnedShowcase";
import StatsStrip from "../../components/landing/StatsStrip";
import AboutSection from "../../components/landing/AboutSection";
import FaqSection from "../../components/landing/FaqSection";
import FinalCta from "../../components/landing/FinalCta";
import Reveal from "../../components/motion/Reveal";

export default function Home() {
  return (
    <div className="landing min-h-screen overflow-x-clip">
      {/* ---------- Hero: the Confluence ---------- */}
      <ConfluenceHero />

      {/* ---------- Floating insight cards ---------- */}
      <section className="relative py-10">
        <InsightCards />
      </section>

      {/* ---------- Integrations marquee ---------- */}
      <Reveal
        as="section"
        className="py-20"
      >
        <IntegrationsMarquee />
      </Reveal>

      {/* ---------- Phone + tagline ---------- */}
      <section className="relative py-24">
        <PhoneChat />
      </section>

      {/* ---------- Features ---------- */}
      <section id="features" className="relative py-24 px-6">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <p className="font-mono text-xs text-[var(--ink-3)] tracking-wide mb-4">── engineered for scale</p>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.025em] text-[var(--ink)] leading-[1.05]">
            Everything to run a thousand dashboards.
          </h2>
        </Reveal>

        <BentoFeatures />
      </section>

      <PinnedShowcase />

      {/* ---------- Stats strip ---------- */}
      <Reveal
        as="section"
        className="py-20 border-y border-[var(--line)]"
      >
        <StatsStrip />
      </Reveal>

      {/* ---------- About ---------- */}
      <section className="relative py-24">
        <AboutSection />
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="relative py-24 border-t border-[var(--line)]">
        <FaqSection />
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="relative py-28">
        <FinalCta />
      </section>

      <FloatingFlo />
    </div>
  );
}
