"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";

const FAQS = [
  {
    q: "How do I connect my Google Analytics?",
    a: "Connect straight from the Integrations tab in your dashboard. We use secure OAuth — one click, no password sharing — and you're syncing GA4 data in under a minute.",
  },
  {
    q: "Is my clients' data secure?",
    a: "Every workspace is fully isolated, and each client's API keys are encrypted at rest with AES-256. One tenant can never see another's data, and we never store your Google password.",
  },
  {
    q: "Can I create custom reports for my clients?",
    a: "Yes. Build white-labeled dashboards with your own branding, colors, and custom URLs — each client sees a report that looks like it came straight from you.",
  },
  {
    q: "Do you offer real-time data tracking?",
    a: "ArbFlow keeps GA4, Meta, and LinkedIn in continuous sync and surfaces anomalies the moment they happen — so you get a plain-English alert instead of finding out days later.",
  },
  {
    q: "What happens if I exceed my plan's data limits?",
    a: "Nothing breaks. We notify you as you approach a limit and you can upgrade anytime — your dashboards keep running while you decide.",
  },
];

function FaqItem({
  q,
  a,
  isOpen,
  onToggle,
  reduceMotion,
}: {
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
  reduceMotion: boolean | null;
}) {
  return (
    <div className="border-b border-[var(--line)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="text-lg font-medium text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
          {q}
        </span>
        <span
          className="flex-shrink-0 w-8 h-8 rounded-full border border-[var(--line)] flex items-center justify-center text-[var(--ink-2)] transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-12 text-[15px] text-[var(--ink-2)] leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqSection() {
  const reduceMotion = useReducedMotionSafe();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-12"
      >
        <p className="font-mono text-xs text-[var(--ink-3)] tracking-wide mb-4">── good questions</p>
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.025em] text-[var(--ink)] leading-[1.05]">
          Frequently asked.
        </h2>
        <p className="text-lg text-[var(--ink-2)] mt-4">
          Everything you need to know about the product and billing.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="border-t border-[var(--line)]"
      >
        {FAQS.map((item, i) => (
          <FaqItem
            key={item.q}
            q={item.q}
            a={item.a}
            isOpen={open === i}
            onToggle={() => setOpen(open === i ? null : i)}
            reduceMotion={reduceMotion}
          />
        ))}
      </motion.div>
    </div>
  );
}
