"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";
import Reveal from "../motion/Reveal";

const FAQS = [
  {
    q: "How do I connect a client's Google Analytics?",
    a: "Sign in with Google, or connect from Integrations. Access is granted on Google's own consent screen and is read-only — no passwords change hands — and ArbFlow lists the client's GA4 properties for you to pick from.",
  },
  {
    q: "Is my clients' data secure?",
    a: "Each client lives in its own workspace, and the OAuth tokens a client grants are encrypted at rest with Fernet (AES-128 with an HMAC-SHA256 signature) before they're stored. Sessions use httpOnly cookies, and sign-ins, password resets and data exports are written to an audit log.",
  },
  {
    q: "Can I send branded reports to clients?",
    a: "Yes. Add your logo, accent colour and footer once per workspace; they appear on the dashboard and on every report. Reports can be exported as a PDF at any time or emailed to clients on a schedule.",
  },
  {
    q: "How fresh is the data, and how do alerts work?",
    a: "GA4 syncs in the background every 30 minutes. Once a day is complete, ArbFlow compares it with that client's own recent baseline; if it's at least 25% off and well outside normal variation, the workspace owner gets a one-sentence email. A weekly digest summarises every client's week.",
  },
  {
    q: "Which platforms does ArbFlow support?",
    a: "Google Analytics 4 today. Meta Ads and LinkedIn Ads are in development, and existing workspaces will be able to add them in place — nothing to migrate.",
  },
  {
    q: "What does it cost?",
    a: "Nothing while ArbFlow is in beta — every account gets the full product, no card required. The plans on the pricing page are the ones we'll launch with, and you'll get plenty of notice before anything changes.",
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
          className="flex-shrink-0 w-8 h-8 rounded-full border border-[var(--line)] flex items-center justify-center text-[var(--ink-2)] transition-transform duration-300 motion-reduce:transition-none"
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
      <Reveal className="text-center mb-12">
        <p className="font-mono text-xs text-[var(--ink-3)] tracking-wide mb-4">── good questions</p>
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.025em] text-[var(--ink)] leading-[1.05]">
          Frequently asked.
        </h2>
        <p className="text-lg text-[var(--ink-2)] mt-4">
          Everything you need to know about the product and billing.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="border-t border-[var(--line)]">
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
      </Reveal>
    </div>
  );
}
