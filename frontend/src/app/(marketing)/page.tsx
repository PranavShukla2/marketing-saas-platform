"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";
import Flo from "../../components/landing/Flo";
import FloatingFlo from "../../components/landing/FloatingFlo";
import GlowBlobs from "../../components/landing/GlowBlobs";
import InsightCards from "../../components/landing/InsightCards";
import IntegrationsMarquee from "../../components/landing/IntegrationsMarquee";
import PhoneChat from "../../components/landing/PhoneChat";
import BentoFeatures from "../../components/landing/BentoFeatures";
import PinnedShowcase from "../../components/landing/PinnedShowcase";
import StatsStrip from "../../components/landing/StatsStrip";
import Sticker from "../../components/landing/Sticker";
import Annotation from "../../components/landing/Annotation";
import AboutSection from "../../components/landing/AboutSection";
import FaqSection from "../../components/landing/FaqSection";
import FinalCta from "../../components/landing/FinalCta";

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const sparklePositions = [
  { top: "8%", left: "10%", delay: 0 },
  { top: "20%", left: "85%", delay: 0.6 },
  { top: "75%", left: "15%", delay: 1.1 },
];

export default function Home() {
  const reduceMotion = useReducedMotionSafe();

  return (
    <div className="landing min-h-screen overflow-x-clip">
      {/* ---------- Hero ---------- */}
      <section className="relative pt-28 sm:pt-36 pb-24 px-6 text-center overflow-hidden">
        <GlowBlobs />

        {/* scattered decorative layer (desktop only) */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none" aria-hidden="true">
          <Sticker className="absolute top-[150px] left-[7%]" color="var(--teal)" rotate={-7} delay={0.1}>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)]" /> GA4 synced
          </Sticker>
          <Sticker className="absolute top-[118px] right-[8%]" color="var(--violet)" rotate={6} delay={0.25}>
            Meta Ads
          </Sticker>
          <Sticker className="absolute top-[270px] left-[5%]" color="var(--coral)" rotate={5} delay={0.4} solid>
            +34% sessions 📈
          </Sticker>
          <Sticker className="absolute top-[300px] right-[6%]" color="var(--indigo)" rotate={-6} delay={0.55}>
            LinkedIn
          </Sticker>
          <Sticker className="absolute top-[430px] right-[12%]" color="var(--amber)" rotate={-4} delay={0.7}>
            no SQL needed
          </Sticker>

          <Annotation
            text="meet Flo 👋"
            arrow="swoop-right"
            color="var(--violet)"
            rotate={-8}
            arrowSize={64}
            className="absolute top-[96px] left-[calc(50%-220px)] items-end"
          />
          <Annotation
            text="free forever"
            arrow="curl-down-right"
            color="var(--coral)"
            rotate={-8}
            arrowSize={58}
            className="absolute top-[605px] left-[calc(50%-320px)] items-start"
          />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="relative max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} className="relative w-[116px] h-[124px] mx-auto mb-6">
            <Flo size={116} tappable className="relative z-10" />
            {sparklePositions.map((s, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`absolute text-[var(--amber)] text-lg ${!reduceMotion ? "animate-twinkle" : ""}`}
                style={{ top: s.top, left: s.left, animationDelay: `${s.delay}s` }}
              >
                ✦
              </span>
            ))}
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] text-xs font-medium text-[var(--ink-2)] mb-6"
          >
            <span className={`w-2 h-2 rounded-full bg-[var(--teal)] inline-block ${!reduceMotion ? "animate-pulse-dot" : ""}`} />
            v1.0 is now live
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-[2.7rem] sm:text-6xl font-semibold tracking-[-0.025em] text-[var(--ink)] leading-[1.05] mb-5">
            Your client&apos;s data.
            <br />
            <span className="bg-gradient-to-r from-[var(--indigo)] via-[var(--violet)] to-[var(--coral)] bg-clip-text text-transparent animate-sweep bg-[length:200%_100%]">
              Beautifully unified.
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg sm:text-xl text-[var(--ink-2)] max-w-xl mx-auto mb-9 leading-relaxed">
            Multi-tenant analytics for agencies. Connect GA4, Meta and LinkedIn securely in seconds — and wake up to what actually changed.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <button className="px-7 py-3.5 rounded-[11px] text-white font-medium shadow-[0_10px_30px_rgba(139,92,246,0.35)] bg-[linear-gradient(100deg,var(--indigo),var(--violet),var(--coral))] animate-shimmer">
                Get started free
              </button>
            </Link>
            <a href="#features">
              <button className="px-7 py-3.5 rounded-[11px] bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] font-medium hover:bg-[var(--page)] transition-colors">
                See features ↓
              </button>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ---------- Floating insight cards ---------- */}
      <section className="relative py-10">
        <InsightCards />
      </section>

      {/* ---------- Integrations marquee ---------- */}
      <motion.section
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="py-20"
      >
        <IntegrationsMarquee />
      </motion.section>

      {/* ---------- Phone + tagline ---------- */}
      <section className="relative py-24">
        <PhoneChat />
      </section>

      {/* ---------- Features ---------- */}
      <section id="features" className="relative py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <p className="font-mono text-xs text-[var(--ink-3)] tracking-wide mb-4">── engineered for scale</p>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.025em] text-[var(--ink)] leading-[1.05]">
            Everything to run a thousand dashboards.
          </h2>
        </motion.div>

        <BentoFeatures />
      </section>

      <PinnedShowcase />

      {/* ---------- Stats strip ---------- */}
      <motion.section
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="py-20 border-y border-[var(--line)]"
      >
        <StatsStrip />
      </motion.section>

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
