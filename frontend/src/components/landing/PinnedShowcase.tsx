"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";
import FeatureDashboardCard from "./FeatureDashboardCard";

/* ---------- tiny chart primitives ---------- */

function DonutChart({ pct = 78, color = "var(--indigo)" }: { pct?: number; color?: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" aria-hidden="true">
      <circle cx="34" cy="34" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
      <circle
        cx="34"
        cy="34"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        transform="rotate(-90 34 34)"
      />
      <text x="34" y="38" textAnchor="middle" className="fill-[var(--ink)]" style={{ fontSize: 15, fontWeight: 600 }}>
        {pct}%
      </text>
    </svg>
  );
}

function Sparkline({ color = "var(--teal)" }: { color?: string }) {
  return (
    <svg width="120" height="42" viewBox="0 0 120 42" aria-hidden="true">
      <defs>
        <linearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,32 18,26 36,30 54,16 72,22 90,8 120,12 120,42 0,42 Z" fill="url(#spk)" />
      <polyline
        points="0,32 18,26 36,30 54,16 72,22 90,8 120,12"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MiniBars() {
  const bars = [
    { h: 60, c: "var(--indigo)" },
    { h: 90, c: "var(--violet)" },
    { h: 45, c: "var(--line)" },
    { h: 75, c: "var(--coral)" },
    { h: 55, c: "var(--line)" },
  ];
  return (
    <div className="flex items-end gap-1.5 h-12">
      {bars.map((b, i) => (
        <div key={i} className="w-3 rounded-md" style={{ height: `${b.h}%`, background: b.c }} />
      ))}
    </div>
  );
}

/* ---------- satellite wrapper ---------- */

type Side = "left" | "right";

function Satellite({
  progress,
  appear,
  leave,
  side,
  drift,
  className,
  children,
}: {
  progress: MotionValue<number>;
  appear: [number, number];
  leave: [number, number];
  side: Side;
  drift: number;
  className: string;
  children: React.ReactNode;
}) {
  const stops = [appear[0], appear[1], leave[0], leave[1]];
  const off = side === "left" ? -70 : 70;
  const opacity = useTransform(progress, stops, [0, 1, 1, 0]);
  const x = useTransform(progress, stops, [off, 0, 0, off]);
  const scale = useTransform(progress, stops, [0.8, 1, 1, 0.9]);
  // gentle vertical parallax across the whole scroll for depth
  const y = useTransform(progress, [0, 1], [drift, -drift]);

  return (
    <motion.div
      aria-hidden="true"
      style={{ opacity, x, y, scale }}
      className={`absolute z-20 hidden lg:block rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-[0_12px_40px_rgba(20,18,46,0.14)] p-4 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function PinnedShowcase() {
  const reduceMotion = useReducedMotionSafe();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const scale = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0.8, 1.06, 1.06, 0.92]);
  const opacity = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [0.35, 1, 1, 0.45]);
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const blobY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.1, 0.82, 0.95], [0, 1, 1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 1], [24, -24]);

  if (reduceMotion) {
    return (
      <div className="max-w-3xl mx-auto px-6 text-center">
        <p className="font-mono text-xs text-[var(--ink-3)] tracking-wide mb-3">── your workspace, live</p>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-[var(--ink)] mb-10">
          One calm view of every client.
        </h2>
        <FeatureDashboardCard />
      </div>
    );
  }

  return (
    <div ref={ref} className="relative min-h-[150vh] lg:min-h-[240vh]">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden px-6">
        {/* section title (fades with scroll) */}
        <motion.div
          style={{ opacity: titleOpacity, y: titleY }}
          className="absolute top-[12vh] left-0 right-0 text-center px-6 z-30 pointer-events-none"
        >
          <p className="font-mono text-xs text-[var(--ink-3)] tracking-wide mb-3">── your workspace, live</p>
          <h2 className="text-3xl sm:text-[2.6rem] font-semibold tracking-[-0.02em] text-[var(--ink)]">
            One calm view of every client.
          </h2>
        </motion.div>

        {/* parallaxing glow blobs */}
        <motion.div
          aria-hidden="true"
          style={{ y: blobY }}
          className="absolute inset-0 pointer-events-none -z-10"
        >
          <div className="absolute top-1/4 left-[12%] w-[340px] h-[340px] rounded-full bg-[var(--violet)] opacity-20 blur-[110px]" />
          <div className="absolute bottom-1/4 right-[12%] w-[320px] h-[320px] rounded-full bg-[var(--coral)] opacity-[0.17] blur-[110px]" />
          <div className="absolute top-1/3 right-1/3 w-[280px] h-[280px] rounded-full bg-[var(--teal)] opacity-15 blur-[110px]" />
        </motion.div>

        <div className="relative w-full max-w-3xl">
          {/* ---- satellite cards popping in from both sides ---- */}
          <Satellite progress={scrollYProgress} appear={[0.10, 0.20]} leave={[0.52, 0.62]} side="left" drift={50} className="-left-44 -top-10 w-44">
            <p className="font-mono text-[11px] text-[var(--ink-3)] mb-2">Conversion rate</p>
            <div className="flex items-center gap-3">
              <DonutChart pct={78} color="var(--indigo)" />
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">4.8%</p>
                <p className="text-[11px] text-[var(--teal)] font-medium">▲ 0.6</p>
              </div>
            </div>
          </Satellite>

          <Satellite progress={scrollYProgress} appear={[0.15, 0.25]} leave={[0.56, 0.66]} side="right" drift={64} className="-right-48 -top-14 w-52">
            <div className="flex items-center justify-between mb-1">
              <p className="font-mono text-[11px] text-[var(--ink-3)]">Revenue, 7d</p>
              <span className="text-[11px] font-semibold text-[var(--teal)]">+28%</span>
            </div>
            <Sparkline color="var(--teal)" />
          </Satellite>

          <Satellite progress={scrollYProgress} appear={[0.24, 0.34]} leave={[0.62, 0.72]} side="left" drift={38} className="-left-52 top-28 w-56">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-[rgba(245,166,35,0.14)] flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 9v4M12 17h.01M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                </svg>
              </span>
              <p className="text-[13px] text-[var(--ink)] leading-snug">
                Bounce rate on <strong>/pricing</strong> jumped <strong>12%</strong> overnight.
              </p>
            </div>
          </Satellite>

          <Satellite progress={scrollYProgress} appear={[0.30, 0.40]} leave={[0.66, 0.76]} side="right" drift={46} className="-right-44 top-24 w-48">
            <p className="font-mono text-[11px] text-[var(--ink-3)] mb-2">Top channels</p>
            <MiniBars />
          </Satellite>

          <Satellite progress={scrollYProgress} appear={[0.36, 0.46]} leave={[0.72, 0.82]} side="left" drift={30} className="-left-40 top-[280px] w-44">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--teal)] animate-pulse-dot" />
              <p className="text-[11px] font-mono text-[var(--ink-3)]">live</p>
            </div>
            <p className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink)] mt-1">327</p>
            <p className="text-[11px] text-[var(--ink-2)]">active right now</p>
          </Satellite>

          <Satellite progress={scrollYProgress} appear={[0.40, 0.50]} leave={[0.74, 0.84]} side="right" drift={36} className="-right-40 top-[260px] w-48">
            <div className="flex items-center gap-2.5">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[rgba(91,91,214,0.14)] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <p className="text-[12px] text-[var(--ink)] leading-snug font-medium">AES-256<br /><span className="text-[var(--ink-3)] font-normal">per tenant</span></p>
            </div>
          </Satellite>

          {/* ---- central growing dashboard ---- */}
          <motion.div style={{ scale, opacity, y }}>
            <FeatureDashboardCard />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
