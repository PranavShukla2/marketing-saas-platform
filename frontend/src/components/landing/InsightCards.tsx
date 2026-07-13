"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";

const ICONS: Record<string, React.ReactNode> = {
  "trending-up": (
    <path d="M3 17l6-6 4 4 8-8M21 7h-5M21 7v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  ),
  bolt: <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
  "alert-triangle": (
    <>
      <path d="M12 9v4M12 17h.01M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
};

const CARDS = [
  {
    icon: "trending-up",
    color: "var(--teal)",
    bg: "rgba(20,184,166,0.12)",
    label: "Acme · live",
    text: (
      <>
        Sessions up <strong className="text-[var(--ink)]">34%</strong> vs last week. Source: organic.
      </>
    ),
  },
  {
    icon: "bolt",
    color: "var(--violet)",
    bg: "rgba(139,92,246,0.12)",
    label: "Northwind",
    text: (
      <>
        Checkout funnel spike — <strong className="text-[var(--ink)]">+182</strong> conversions today.
      </>
    ),
  },
  {
    icon: "alert-triangle",
    color: "var(--coral)",
    bg: "rgba(255,107,94,0.12)",
    label: "Anomaly",
    text: (
      <>
        Bounce rate climbing on <strong className="text-[var(--ink)]">/pricing</strong>. Worth a look.
      </>
    ),
  },
];

export default function InsightCards() {
  const reduceMotion = useReducedMotionSafe();
  const [highlighted, setHighlighted] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const interval = setInterval(() => {
      setHighlighted((i) => (i + 1) % CARDS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [reduceMotion]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-5xl mx-auto px-6">
      {CARDS.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
          whileHover={{ y: -5 }}
          className={`rounded-2xl bg-[var(--surface)] border p-5 transition-shadow duration-300 ${!reduceMotion ? "animate-float-y" : ""}`}
          style={{
            animationDelay: `${i * 0.4}s`,
            borderColor: highlighted === i ? "var(--violet)" : "var(--line)",
            transform: highlighted === i ? "scale(1.02)" : undefined,
            boxShadow:
              highlighted === i
                ? "0 1px 2px rgba(20,18,46,.04), 0 10px 30px rgba(139,92,246,.18)"
                : "0 1px 2px rgba(20,18,46,.04), 0 10px 30px rgba(20,18,46,.07)",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ background: card.bg, color: card.color }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              {ICONS[card.icon]}
            </svg>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-3)] mb-2">{card.label}</p>
          <p className="text-sm text-[var(--ink-2)] leading-relaxed">{card.text}</p>
        </motion.div>
      ))}
    </div>
  );
}
