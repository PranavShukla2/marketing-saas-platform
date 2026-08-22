"use client";

import { motion } from "framer-motion";

/* ---------------- Mini sparkline ---------------- */

export function Sparkline({
  data,
  color = "var(--indigo)",
  width = 120,
  height = 36,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((d, i) => [i * step, height - ((d - min) / span) * (height - 4) - 2]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const id = `spk-${color.replace(/[^a-z]/gi, "")}`;
  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------- KPI card ---------------- */

export function KpiCard({
  label,
  value,
  delta,
  spark,
  color = "var(--indigo)",
  index = 0,
}: {
  label: string;
  value: string;
  delta?: number;
  spark?: number[];
  color?: string;
  index?: number;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      className="rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-5 shadow-[0_1px_2px_rgba(20,18,46,.04)] hover:shadow-[0_10px_30px_rgba(20,18,46,.08)] transition-shadow"
    >
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">{label}</p>
        {delta !== undefined && (
          <span
            className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md"
            style={{
              // Darker than the brand teal/coral so the tiny chip text passes
              // WCAG AA contrast on its tinted background.
              color: up ? "#0b766c" : "#c2372a",
              background: up ? "rgba(20,184,166,.12)" : "rgba(255,107,94,.12)",
            }}
          >
            {up ? "▲" : "▼"} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)] mt-2">{value}</p>
      {spark && (
        <div className="mt-3">
          <Sparkline data={spark} color={color} width={220} height={34} />
        </div>
      )}
    </motion.div>
  );
}

/* ---------------- Section card (titled container) ---------------- */

export function SectionCard({
  title,
  subtitle,
  right,
  className = "",
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`rounded-3xl bg-[var(--surface)] border border-[var(--line)] p-6 sm:p-7 shadow-[0_1px_2px_rgba(20,18,46,.04)] ${className}`}
    >
      {(title || right) && (
        <div className="flex items-start justify-between mb-5">
          <div>
            {title && <h3 className="text-base font-semibold text-[var(--ink)]">{title}</h3>}
            {subtitle && <p className="text-xs text-[var(--ink-3)] mt-0.5">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </motion.div>
  );
}

/* ---------------- Ranked horizontal bar list ---------------- */

const PALETTE = ["var(--indigo)", "var(--violet)", "var(--teal)", "var(--amber)", "var(--coral)", "var(--pink)", "var(--indigo)", "var(--violet)"];

export function BarList({
  items,
  valueFormat,
}: {
  items: { label: string; value: number; hint?: string }[];
  valueFormat?: (v: number) => string;
}) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-[var(--ink-3)]">No data yet.</p>;
  }
  const max = Math.max(...items.map((i) => i.value)) || 1;
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={it.label + i} className="group">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-[var(--ink)] font-medium truncate pr-3">{it.label}</span>
            <span className="text-[var(--ink-2)] tabular-nums flex-shrink-0">
              {valueFormat ? valueFormat(it.value) : it.value.toLocaleString()}
              {it.hint && <span className="text-[var(--ink-3)] ml-1.5">{it.hint}</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--line)] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${(it.value / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: PALETTE[i % PALETTE.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export { PALETTE };
