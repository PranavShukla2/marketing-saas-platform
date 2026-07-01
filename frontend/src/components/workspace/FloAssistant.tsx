"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Flo from "../landing/Flo";

const STEPS = [
  {
    title: "Hey, I'm Flo 👋",
    body: "Welcome to your workspace. Give me a few taps and I'll show you around — it's quick.",
  },
  {
    title: "Pick a data source",
    body: "Use the switcher up top to flip between Google Analytics, Meta, and LinkedIn. GA4 is the deep one.",
  },
  {
    title: "Your headline numbers",
    body: "The KPI band shows users, sessions, revenue and more — each with its own 30-day trend line.",
  },
  {
    title: "Go deeper by section",
    body: "Each tab drills into a slice — GA4 audience & conversions, or your Facebook, Instagram and Ads numbers.",
  },
  {
    title: "Sync & export anytime",
    body: "Hit Sync to pull fresh data, or export a branded PDF/CSV for your client. That's it — happy analyzing!",
  },
];

const SEEN_KEY = "arbflow_flo_guide_seen";

export default function FloAssistant() {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Auto-open the first time someone lands on the workspace.
    const seen = localStorage.getItem(SEEN_KEY);
    if (!seen) {
      const t = setTimeout(() => setOpen(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    setOpen(false);
    localStorage.setItem(SEEN_KEY, "1");
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else close();
  };

  if (!mounted) return null;

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  // The "water drop closing" exit: the panel pinches into a teardrop, rounds
  // off, and falls away while fading — like a drop letting go.
  const dropExit = reduceMotion
    ? { opacity: 0 }
    : {
        opacity: 0,
        scale: 0.18,
        y: 46,
        borderRadius: "50% 50% 50% 50% / 65% 65% 35% 35%",
        transition: { duration: 0.5, ease: [0.5, 0, 0.75, 0] as const },
      };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            key="panel"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, borderRadius: "24px" }}
            exit={dropExit}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="pointer-events-auto w-[300px] bg-white border border-[var(--line)] shadow-[0_20px_60px_rgba(20,18,46,0.18)] p-5 origin-bottom-right"
            style={{ borderRadius: 24 }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 -mt-1">
                <Flo size={46} tappable />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--ink)]">{current.title}</p>
                  <button
                    onClick={close}
                    aria-label="Close guide"
                    className="text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors -mr-1 -mt-1 p-1"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
                <p className="text-[13px] text-[var(--ink-2)] leading-relaxed mt-1.5">{current.body}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: i === step ? 18 : 6,
                      background: i === step ? "var(--violet)" : "var(--line)",
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="text-xs font-medium text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors px-2 py-1"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={next}
                  className="text-xs font-semibold text-white px-3.5 py-1.5 rounded-lg bg-[linear-gradient(100deg,var(--indigo),var(--violet))] hover:opacity-90 transition-opacity"
                >
                  {isLast ? "Got it" : "Next"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Re-open button — a little floating Flo droplet when the guide is closed. */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="reopen"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 22, delay: 0.15 }}
            onClick={() => {
              setStep(0);
              setOpen(true);
            }}
            aria-label="Open Flo's guide"
            className="pointer-events-auto w-14 h-14 rounded-full bg-white border border-[var(--line)] shadow-[0_10px_30px_rgba(20,18,46,0.16)] flex items-center justify-center hover:shadow-[0_14px_40px_rgba(139,92,246,0.3)] transition-shadow"
          >
            <Flo size={40} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
