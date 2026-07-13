"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";
import Flo from "./Flo";
import GlowBlobs from "./GlowBlobs";

const TECH = [
  { label: "Next.js", color: "var(--indigo)" },
  { label: "FastAPI", color: "var(--teal)" },
  { label: "PostgreSQL", color: "var(--violet)" },
  { label: "GA4 Data API", color: "var(--amber)" },
];

export default function AboutSection() {
  const reduceMotion = useReducedMotionSafe();

  return (
    <div className="relative max-w-5xl mx-auto px-6">
      <GlowBlobs className="opacity-60" />
      <p className="font-mono text-xs text-[var(--ink-3)] tracking-wide mb-10 text-center sm:text-left">── about</p>

      <div className="grid md:grid-cols-[auto_1fr] gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-[140px] h-[140px] mx-auto"
        >
          <div
            className={`absolute inset-0 rounded-full ${!reduceMotion ? "animate-conic-spin" : ""}`}
            style={{
              background:
                "conic-gradient(from 0deg, var(--indigo), var(--violet), var(--coral), var(--amber), var(--teal), var(--indigo))",
            }}
          />
          <div className="absolute inset-[6px] rounded-full bg-[var(--surface)] flex items-center justify-center">
            <span className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink)]">PS</span>
          </div>
          <div className="absolute -bottom-1 -right-1 rounded-full bg-[var(--surface)] p-1 shadow-[0_4px_12px_rgba(20,18,46,0.15)]">
            <Flo variant="mark" size={28} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          <h2 className="text-3xl sm:text-[2.6rem] font-semibold tracking-[-0.02em] text-[var(--ink)] mb-4 leading-[1.1]">
            Built by a founder tired of GA4 tabs.
          </h2>
          <p className="text-lg text-[var(--ink-2)] leading-relaxed max-w-xl">
            I&apos;m <strong className="text-[var(--ink)]">Pranav</strong> — ArbFlow started as a frustration: agencies juggling a dozen Google Analytics tabs and still not knowing what changed. So I&apos;m building the analytics layer I always wanted — fast, multi-tenant, and honest about the numbers.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            {TECH.map((tech, i) => (
              <span
                key={tech.label}
                className={`px-4 py-2 rounded-full border border-[var(--line)] bg-[var(--surface)] text-sm font-medium ${!reduceMotion ? "animate-float-y" : ""}`}
                style={{ color: tech.color, animationDelay: `${i * 0.3}s` }}
              >
                {tech.label}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
