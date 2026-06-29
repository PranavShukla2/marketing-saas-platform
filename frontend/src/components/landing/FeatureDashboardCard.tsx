"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import CountUp from "./CountUp";

const BARS = [40, 65, 50, 80, 60, 95, 70];

export default function FeatureDashboardCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const reduceMotion = useReducedMotion();

  return (
    <div
      ref={ref}
      className="rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-6 sm:p-8 shadow-[0_1px_2px_rgba(20,18,46,.04),0_10px_30px_rgba(20,18,46,.07)]"
    >
      <div className="flex items-center justify-between pb-5 mb-6 border-b border-[var(--line)]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--indigo)] to-[var(--violet)] flex items-center justify-center text-white text-sm font-bold">
            A
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-[var(--ink)] leading-tight">Acme Inc · Workspace</p>
            <p className="text-[11px] text-[var(--ink-3)] leading-tight">Live overview · last 7 days</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(20,184,166,0.12)] text-[11px] font-medium text-[var(--teal)]">
          <span className={`w-1.5 h-1.5 rounded-full bg-[var(--teal)] ${reduceMotion ? "" : "animate-pulse-dot"}`} /> live
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div>
          <p className="text-xs font-mono text-[var(--ink-3)] mb-1">Sessions</p>
          <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
            <CountUp value={48210} separator duration={1.6} />
          </p>
        </div>
        <div>
          <p className="text-xs font-mono text-[var(--ink-3)] mb-1">Conversions</p>
          <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
            <CountUp value={1842} separator duration={1.6} />
          </p>
        </div>
        <div>
          <p className="text-xs font-mono text-[var(--ink-3)] mb-1">Active now</p>
          <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
            <CountUp value={327} separator duration={1.6} />
          </p>
        </div>
      </div>

      <div className="relative h-40 flex items-end gap-3">
        {BARS.map((height, i) => (
          <div key={i} className="flex-1 h-full flex items-end">
            <motion.div
              initial={{ scaleY: reduceMotion ? 1 : 0 }}
              animate={inView ? { scaleY: 1 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
              style={{ height: `${height}%`, transformOrigin: "bottom" }}
              className={`w-full rounded-md ${
                i === 3 || i === 5
                  ? "bg-gradient-to-t from-[var(--indigo)] to-[var(--violet)]"
                  : "bg-[var(--line)]"
              }`}
            />
          </div>
        ))}

        <svg
          viewBox="0 0 280 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          <motion.polyline
            points="0,70 40,55 80,62 120,30 160,45 200,12 240,28 280,5"
            fill="none"
            stroke="var(--coral)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: reduceMotion ? 1 : 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
          />
        </svg>
      </div>
    </div>
  );
}
