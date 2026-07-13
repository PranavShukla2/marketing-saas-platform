"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";

const tileVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.92 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

function WorkspaceStackVisual(_props: { reduceMotion: boolean | null }) {
  return (
    <div className="relative w-full h-24 mt-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute w-32 h-16 rounded-xl bg-white border border-[var(--line)] shadow-[0_8px_20px_rgba(20,18,46,0.08)]"
          style={{
            left: `${i * 18}px`,
            top: `${i * 10}px`,
            zIndex: 3 - i,
            opacity: 1 - i * 0.18,
          }}
        >
          <div className="flex items-center gap-1.5 px-2.5 pt-2">
            <div className="w-4 h-4 rounded-md bg-[rgba(91,91,214,0.15)] flex items-center justify-center">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="h-1.5 w-12 rounded-full bg-[var(--line)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SyncVisual({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <div className="flex items-center gap-3 mt-2">
      <div
        className="w-8 h-8 rounded-lg bg-[rgba(20,184,166,0.12)] flex items-center justify-center"
        style={!reduceMotion ? { animation: "conic-spin 3.5s linear infinite" } : undefined}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
        </svg>
      </div>
      <svg width="60" height="22" viewBox="0 0 60 22" aria-hidden="true">
        <motion.polyline
          points="0,16 10,12 20,14 30,5 40,9 50,3 60,7"
          fill="none"
          stroke="var(--teal)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: "easeInOut", repeat: reduceMotion ? 0 : Infinity, repeatDelay: 1.2 }}
        />
      </svg>
    </div>
  );
}

function AlertTypingVisual({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[rgba(245,166,35,0.12)] w-fit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] inline-block"
          style={
            !reduceMotion
              ? { animation: "pulse-dot 1.2s ease-in-out infinite", animationDelay: `${i * 0.18}s` }
              : undefined
          }
        />
      ))}
    </div>
  );
}

function SwatchVisual({ reduceMotion }: { reduceMotion: boolean | null }) {
  const colors = ["var(--indigo)", "var(--violet)", "var(--coral)", "var(--amber)", "var(--teal)"];
  return (
    <div className="flex gap-2 mt-2">
      {colors.map((c, i) => (
        <span
          key={i}
          className="w-6 h-6 rounded-full"
          style={{
            background: c,
            ...(!reduceMotion ? { animation: "twinkle 3.6s ease-in-out infinite", animationDelay: `${i * 0.25}s` } : {}),
          }}
        />
      ))}
    </div>
  );
}

function AnomalyVisual({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <div className="relative mt-2">
      <svg width="100%" height="40" viewBox="0 0 160 40" preserveAspectRatio="none" aria-hidden="true">
        <polyline
          points="0,30 25,26 50,28 75,15 100,20 125,8 160,12"
          fill="none"
          stroke="var(--coral)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="absolute w-2.5 h-2.5 rounded-full bg-[var(--coral)]"
        style={{ left: "125px", top: "1px", ...(!reduceMotion ? { animation: "pulse-dot 1.4s ease-in-out infinite" } : {}) }}
      />
    </div>
  );
}

const TILES = [
  {
    num: "/01",
    color: "var(--indigo)",
    span: "sm:col-span-4 sm:row-span-2",
    title: "Multi-tenant workspaces",
    body: "Complete data isolation. Every client's keys are AES-256 encrypted and scoped to their own workspace.",
    visual: WorkspaceStackVisual,
    big: true,
  },
  {
    num: "/—",
    color: "var(--teal)",
    span: "sm:col-span-2",
    title: "Live GA4 sync",
    body: "Always-current data, no rate-limit headaches.",
    visual: SyncVisual,
  },
  {
    num: "/02",
    color: "var(--amber)",
    span: "sm:col-span-2",
    title: "Plain-English alerts",
    body: "What changed, and why — in a sentence.",
    visual: AlertTypingVisual,
  },
  {
    num: "/03",
    color: "var(--violet)",
    span: "sm:col-span-3",
    title: "White-labeled dashboards",
    body: "Your branding, your URLs, your color schemes.",
    visual: SwatchVisual,
  },
  {
    num: "/—",
    color: "var(--coral)",
    span: "sm:col-span-3",
    title: "Anomaly detection",
    body: "We flag the spikes and dips worth a look.",
    visual: AnomalyVisual,
  },
];

export default function BentoFeatures() {
  const reduceMotion = useReducedMotionSafe();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-6 sm:auto-rows-[150px] gap-3.5 max-w-5xl mx-auto px-6">
      {TILES.map((tile, i) => {
        const Visual = tile.visual;
        return (
          <motion.div
            key={tile.title}
            variants={tileVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className={`relative rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-5 shadow-[0_1px_2px_rgba(20,18,46,.04),0_10px_30px_rgba(20,18,46,.07)] transition-shadow overflow-hidden flex flex-col ${tile.span}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs" style={{ color: tile.color }}>{tile.num}</span>
            </div>
            <h3 className={`font-medium text-[var(--ink)] tracking-[-0.01em] ${tile.big ? "text-lg" : "text-base"}`}>{tile.title}</h3>
            <p className="text-sm text-[var(--ink-2)] mt-1 leading-relaxed">{tile.body}</p>
            <Visual reduceMotion={reduceMotion} />
          </motion.div>
        );
      })}
    </div>
  );
}
