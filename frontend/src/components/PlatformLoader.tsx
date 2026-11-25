"use client";

import { motion } from "framer-motion";
import { DURATION, EASE_OUT } from "../lib/motion";

/**
 * Shown while the workspace switches data source. Each source is its own
 * colour (the Tidewater rule: colour = source, everywhere) and marked with its
 * initials — no third-party logos, so it reads as ArbFlow's UI rather than a
 * collage of other companies' branding.
 */
const SOURCES: Record<string, { name: string; mark: string; color: string }> = {
  google: { name: "Google Analytics", mark: "GA4", color: "var(--source-ga4)" },
  meta: { name: "Meta Ads", mark: "M", color: "var(--source-meta)" },
  linkedin: { name: "LinkedIn Ads", mark: "in", color: "var(--source-linkedin)" },
};

export default function PlatformLoader({ platform }: { platform: string }) {
  const s = SOURCES[platform] ?? SOURCES.google;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DURATION.panel }}
      role="status"
      aria-label={`Loading ${s.name}`}
      className="glass-strong fixed inset-0 z-[100] flex flex-col items-center justify-center border-0"
    >
      <motion.span
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DURATION.step, ease: EASE_OUT }}
        className="flex size-14 items-center justify-center rounded-[var(--radius-md)] font-mono text-base font-semibold text-white shadow-[var(--shadow-raised)]"
        style={{ background: s.color }}
        aria-hidden="true"
      >
        {s.mark}
      </motion.span>
      <p className="mt-5 text-base font-semibold tracking-[-0.01em] text-[var(--ink)]">{s.name}</p>
      <div className="mt-4 h-0.5 w-40 overflow-hidden rounded-full bg-[var(--line)]" aria-hidden="true">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 0.9, ease: "easeInOut", repeat: Infinity }}
          className="h-full w-1/2 rounded-full"
          style={{ background: s.color }}
        />
      </div>
    </motion.div>
  );
}
