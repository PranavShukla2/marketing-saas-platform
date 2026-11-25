"use client";

import { motion } from "framer-motion";
import { Badge } from "../../ui";
import { BarList, KpiCard, SectionCard } from "../../workspace/primitives";
import { demoData } from "../../../lib/demoData";
import { EASE_OUT } from "../../../lib/motion";
import { useReducedMotionSafe } from "../../../lib/useReducedMotionSafe";
import { Act, BrowserFrame } from "./Act";

/*
 * The real workspace components, at rest, on the demo dataset — the same
 * KpiCard / SectionCard / BarList the app renders. Only the trend series is
 * local: demoData builds its dates from `new Date()`, and this page is
 * prerendered at build time, so using it here would make the server's numbers
 * differ from the visitor's on any later day.
 */
const TREND = [
  2810, 2940, 2875, 3020, 2610, 2240, 2380, 3105, 3190, 3240, 3170, 2760, 2390, 2520,
  3310, 3380, 3460, 3405, 2980, 2610, 2700, 3520, 3600, 3655, 3590, 3140, 2790, 2880,
  3720, 3810,
];
const SPARK = (offset: number) => TREND.slice(offset, offset + 14);

const fmt = new Intl.NumberFormat("en-US");

function TrendArea() {
  const reduce = useReducedMotionSafe();
  const W = 640, H = 200, P = 8;
  const max = Math.max(...TREND) * 1.08, min = Math.min(...TREND) * 0.85;
  const x = (i: number) => P + (i / (TREND.length - 1)) * (W - P * 2);
  const y = (v: number) => H - P - ((v - min) / (max - min)) * (H - P * 2);
  const line = TREND.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  const area = `${line}L${x(TREND.length - 1)} ${H}L${x(0)} ${H}Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[200px] w-full" preserveAspectRatio="none" role="img" aria-label="Sessions over the last 30 days, rising from about 2,800 to 3,800 a day">
      <defs>
        <linearGradient id="ov-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--unified)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--unified)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="var(--line)" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
      ))}
      <path d={area} fill="url(#ov-area)" />
      <motion.path
        d={line}
        fill="none"
        stroke="var(--unified)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        // Evaluated when the draw starts, by which point the hydration-safe
        // reduced-motion flag has resolved: under reduced motion it just appears.
        transition={reduce ? { duration: 0 } : { duration: 1.1, ease: EASE_OUT }}
      />
    </svg>
  );
}

function OneViewVisual() {
  const s = demoData.summary;
  return (
    <BrowserFrame title={`${demoData.company_name} — workspace · Overview`}>
      <div className="space-y-5 bg-[var(--page)] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--ink)] font-mono text-xs font-semibold text-[var(--page)]">NC</span>
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">{demoData.company_name}</p>
              <p className="text-xs text-[var(--ink-3)]">Google Analytics 4 · last 30 days</p>
            </div>
          </div>
          <Badge tone="neutral">Sample data</Badge>
        </div>

        <div className="hidden gap-1 border-b border-[var(--line)] text-sm sm:flex" aria-hidden="true">
          {["Overview", "Audience", "Acquisition", "Behavior", "Conversions"].map((t, i) => (
            <span key={t} className={i === 0 ? "border-b-2 border-[var(--accent)] px-3 pb-2 font-medium text-[var(--ink)]" : "px-3 pb-2 text-[var(--ink-3)]"}>
              {t}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard index={0} label="Active users" value={s.active_users} delta={12} spark={SPARK(0)} color="var(--unified)" />
          <KpiCard index={1} label="Sessions" value={s.sessions} delta={9} spark={SPARK(8)} color="var(--unified)" />
          <KpiCard index={2} label="Engagement rate" value={s.engagement_rate} delta={3} spark={SPARK(4)} color="var(--source-linkedin)" />
          <KpiCard index={3} label="Conversions" value={s.conversions} delta={-4} spark={SPARK(12)} color="var(--source-ga4)" />
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <SectionCard title="Sessions" subtitle="Daily, last 30 days" className="lg:col-span-2">
            <TrendArea />
          </SectionCard>
          <SectionCard title="Top channels" subtitle="By users">
            <BarList
              items={demoData.channel_data.slice(0, 5).map((c) => ({ label: c.channel, value: c.users }))}
              valueFormat={(v) => fmt.format(v)}
            />
          </SectionCard>
        </div>
      </div>
    </BrowserFrame>
  );
}

export default function ActOneView() {
  return (
    <Act
      index={1}
      layout="stacked"
      title={<>Every client, <span className="accent-serif">one calm view.</span></>}
      body={
        <p>
          Users, sessions, channels, pages, devices, countries and conversions — every GA4 metric that matters, laid out
          the same way for every client, so you stop rebuilding the same report in a dozen tabs.
        </p>
      }
      visual={<OneViewVisual />}
    />
  );
}

