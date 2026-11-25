"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { AlertTriangle, Mail } from "lucide-react";
import { useReducedMotionSafe } from "../../../lib/useReducedMotionSafe";
import { Act } from "./Act";

/*
 * A sample that the real detector would flag (backend/app/services/anomaly.py):
 * 19 baseline days averaging exactly 1,745 (σ ≈ 88), then 1,204 — z ≈ −6.2 and
 * −31%, past both the 2.5σ and 25% floors. The message below is the detector's
 * own sentence format, filled in with these numbers. Today is partial, dashed,
 * and excluded, as it is in the detector.
 */
const BASELINE = [1690, 1760, 1825, 1790, 1705, 1580, 1620, 1735, 1810, 1870, 1820, 1730, 1610, 1655, 1760, 1840, 1890, 1795, 1670];
const DIP = 1204;
const TODAY_PARTIAL = 640;
const MESSAGE = "Sessions on 24 Nov came in at 1,204 — 31% below your recent daily average of 1,745.";

const W = 640, H = 240, PX = 16, PY = 24;
const ALL = [...BASELINE, DIP, TODAY_PARTIAL];
const max = 2000, min = 500;
const x = (i: number) => PX + (i / (ALL.length - 1)) * (W - PX * 2);
const y = (v: number) => PY + (1 - (v - min) / (max - min)) * (H - PY * 2);
const solid = [...BASELINE, DIP].map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
const partial = `M${x(ALL.length - 2).toFixed(1)} ${y(DIP).toFixed(1)}L${x(ALL.length - 1).toFixed(1)} ${y(TODAY_PARTIAL).toFixed(1)}`;
const avgY = y(1745);
const dip = { x: x(BASELINE.length), y: y(DIP) };

type Stage = 0 | 1 | 2 | 3 | 4; // idle → line drawn → drop lands → ripple → alert

function RipplesVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.55 });
  const reduce = useReducedMotionSafe();
  const [played, setStage] = useState<Stage>(0);
  const [typedN, setTyped] = useState(0);
  // Under reduced motion the finished state is simply shown — derived, not set.
  const stage: Stage = reduce ? 4 : played;
  const typed = reduce ? MESSAGE.length : typedN;

  useEffect(() => {
    if (!inView || reduce) return;
    const t = [
      setTimeout(() => setStage(1), 50),
      setTimeout(() => setStage(2), 1250),
      setTimeout(() => setStage(3), 1700),
      setTimeout(() => setStage(4), 2300),
    ];
    return () => t.forEach(clearTimeout);
  }, [inView, reduce]);

  // The alert writes itself, at reading pace.
  useEffect(() => {
    if (reduce || stage < 4 || typed >= MESSAGE.length) return;
    const id = setTimeout(() => setTyped((n) => Math.min(MESSAGE.length, n + 2)), 28);
    return () => clearTimeout(id);
  }, [reduce, stage, typed]);

  const flagged = stage >= 3;

  return (
    <div ref={ref} className="relative">
      <div className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-raised)] sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">Sessions · Northwind Co.</p>
            <p className="text-xs text-[var(--ink-3)]">Daily, last 21 days</p>
          </div>
          <p className="font-mono text-[11px] text-[var(--ink-3)]">avg 1,745 / day</p>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 h-auto w-full overflow-visible" role="img" aria-label="Daily sessions hold near 1,745, then drop to 1,204 yesterday">
          <line x1={PX} x2={W - PX} y1={avgY} y2={avgY} stroke="var(--ink-3)" strokeOpacity="0.5" strokeDasharray="4 6" />
          <motion.path
            d={solid}
            fill="none"
            stroke="var(--unified)"
            strokeWidth={2.25}
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: stage >= 1 ? 1 : 0 }}
            transition={{ duration: reduce ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
          <path d={partial} fill="none" stroke="var(--unified)" strokeOpacity={stage >= 1 ? 0.5 : 0} strokeWidth={2} strokeDasharray="3 5" />

          {/* The drop, falling onto the day that's off. */}
          {stage === 2 && (
            <motion.circle cx={dip.x} r={5} fill="var(--anomaly)" initial={{ cy: dip.y - 90, opacity: 0 }} animate={{ cy: dip.y, opacity: 1 }} transition={{ duration: 0.42, ease: [0.55, 0, 1, 0.45] }} />
          )}
          {/* Ripples spread from where it lands. */}
          {flagged && !reduce &&
            [0, 1, 2].map((i) => (
              <motion.circle
                key={i}
                cx={dip.x}
                cy={dip.y}
                r={8}
                fill="none"
                stroke="var(--anomaly)"
                strokeWidth={1.5}
                initial={{ scale: 0.4, opacity: 0.8 }}
                animate={{ scale: 4.5, opacity: 0 }}
                transition={{ duration: 1.4, delay: i * 0.22, ease: "easeOut" }}
                style={{ transformOrigin: `${dip.x}px ${dip.y}px`, transformBox: "view-box" }}
              />
            ))}
          {flagged && <circle cx={dip.x} cy={dip.y} r={5.5} fill="var(--anomaly)" stroke="var(--surface)" strokeWidth={2} />}
        </svg>

        {/* Labels sit under the days they name — the dip's label under the dip. */}
        <div className="relative mt-2 h-4 font-mono text-[10px] text-[var(--ink-3)]">
          <span className="absolute -translate-x-0" style={{ left: `${(x(0) / W) * 100}%` }}>4 Nov</span>
          <span
            className={`absolute -translate-x-full whitespace-nowrap pr-1 ${flagged ? "text-[var(--anomaly-ink)]" : ""}`}
            style={{ left: `${(dip.x / W) * 100}%` }}
          >
            24 Nov
          </span>
          <span className="absolute right-0">today</span>
        </div>
      </div>

      {/* The alert: the detector's own sentence. */}
      <div
        className="relative mt-4 ml-auto max-w-md rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-overlay)] transition-[opacity,transform] duration-[var(--dur-step)] ease-[var(--ease-house)] sm:mr-6"
        style={{ opacity: stage >= 4 ? 1 : 0, transform: stage >= 4 ? "none" : "translateY(8px)" }}
        aria-live="polite"
      >
        <div className="flex gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--anomaly)]/12 text-[var(--anomaly-ink)]">
            <AlertTriangle className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--ink)]">Unusual dip · Northwind Co.</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--ink-2)]" aria-hidden="true">
              {MESSAGE.slice(0, typed)}
              {typed < MESSAGE.length && <span className="ml-px inline-block h-3.5 w-px translate-y-0.5 bg-[var(--ink-2)]" aria-hidden="true" />}
            </p>
            <p className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-[var(--ink-3)]">
              <Mail className="size-3" /> also emailed to the workspace owner
            </p>
          </div>
        </div>
        {/* Screen readers get the whole sentence at once, not letter by letter. */}
        <span className="sr-only">{stage >= 4 ? MESSAGE : ""}</span>
      </div>
    </div>
  );
}

export default function ActRipples() {
  return (
    <Act
      index={2}
      flip
      title={<>Know what changed, <span className="accent-serif">in a sentence.</span></>}
      body={
        <p>
          As each day closes, ArbFlow checks it against that client&apos;s own recent normal, for every client.
          When something is genuinely off, you get one plain sentence — not a chart to squint at.
        </p>
      }
      facts={[
        "Flags only real moves: at least 25%, and well outside the client's usual variation",
        "Spikes and dips alike, by email to the workspace owner",
        "A weekly digest of every client's week against the one before",
      ]}
      visual={<RipplesVisual />}
    />
  );
}
