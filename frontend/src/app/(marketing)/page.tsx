"use client";

import ConfluenceHero from "../../components/landing/ConfluenceHero";
import { ActRail } from "../../components/landing/story/Act";
import ActConnect from "../../components/landing/story/ActConnect";
import ActOneView from "../../components/landing/story/ActOneView";
import ActRipples from "../../components/landing/story/ActRipples";
import ActBrand from "../../components/landing/story/ActBrand";
import ActVault from "../../components/landing/story/ActVault";
import FaqSection from "../../components/landing/FaqSection";
import FinalCta from "../../components/landing/FinalCta";
import FloatingFlo from "../../components/landing/FloatingFlo";

/**
 * The landing, told as a story (Part II, Phase 9): the hero's confluence, then
 * five acts — each one a thing the product does today, shown working — then
 * the questions people ask, and back to deep water to close.
 */
export default function Home() {
  return (
    <div className="landing min-h-screen overflow-x-clip">
      <ConfluenceHero />
      <ActRail />

      <ActConnect />
      <Divider />
      <ActOneView />
      <Divider />
      <ActRipples />
      <Divider />
      <ActBrand />
      <Divider />
      <ActVault />

      <section id="faq" className="border-t border-[var(--line)] py-24 sm:py-32">
        <FaqSection />
      </section>

      <FinalCta />
      <FloatingFlo />
    </div>
  );
}

/** A hairline between acts, inset to the content width. */
function Divider() {
  return <div aria-hidden="true" className="mx-auto h-px max-w-6xl bg-[var(--line)]" />;
}
