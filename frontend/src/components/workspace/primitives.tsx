"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle, CountUp, Skeleton } from "../ui";
import { cn } from "../../lib/cn";
import { DURATION, EASE_OUT } from "../../lib/motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";

/* ---------------- Mini sparkline ---------------- */

export function Sparkline({
  data,
  color = "var(--indigo)",
  width = 220,
  height = 34,
  className,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  // Ids must be unique per instance: SVG defs live in one document-wide
  // namespace, so two sparklines sharing an id means the second one paints
  // with the first one's gradient.
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  if (!data || data.length < 2) return <div style={{ width, height }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((d, i) => [i * step, height - ((d - min) / span) * (height - 4) - 2]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("w-full overflow-visible", className)}
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spk-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spk-${uid})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ---------------- KPI card ---------------- */

/** Numbers count up; anything else (durations, "48.2%") renders as given. */
function numeric(value: string | number): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = value.replace(/[,\s]/g, "");
  // Only treat a string as a number if that's *all* it is — "2m 14s" must not
  // count up to 2.
  return /^-?\d+(\.\d+)?$/.test(cleaned) ? parseFloat(cleaned) : null;
}

export function KpiCard({
  label,
  value,
  delta,
  spark,
  color = "var(--indigo)",
  index = 0,
  hint,
  format,
}: {
  label: string;
  value: string | number;
  delta?: number;
  spark?: number[];
  color?: string;
  index?: number;
  /** Extra context revealed on hover/focus — the period, the comparison, etc. */
  hint?: string;
  format?: (n: number) => string;
}) {
  const reduce = useReducedMotionSafe();
  const n = numeric(value);
  const up = (delta ?? 0) >= 0;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { duration: DURATION.base, delay: index * 0.05, ease: EASE_OUT }}
      className="group h-full"
    >
      <Card padding="sm" className="h-full p-5 hover:shadow-[var(--shadow-raised)]">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">{label}</p>
          {delta !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                // Tinted chips need a per-theme foreground: the AA-safe dark
                // teal that works on a light tint is illegible on a dark page.
                up
                  ? "bg-teal-500/12 text-teal-700 dark:text-teal-300"
                  : "bg-red-500/12 text-red-700 dark:text-red-300"
              )}
            >
              {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {Math.abs(delta)}%
            </span>
          )}
        </div>

        <p className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
          {n === null ? value : <CountUp value={n} format={format} />}
        </p>

        {spark && (
          <div className="mt-3">
            <Sparkline data={spark} color={color} />
          </div>
        )}

        {hint && (
          // Present for assistive tech at all times; revealed visually on
          // hover or keyboard focus so the resting card stays uncluttered.
          <p className="mt-2 text-[11px] text-[var(--ink-3)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:opacity-100">
            {hint}
          </p>
        )}
      </Card>
    </motion.div>
  );
}

export function KpiCardSkeleton() {
  return (
    <Card padding="sm" className="h-full p-5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-8 w-28" />
      <Skeleton className="mt-4 h-[34px] w-full" />
    </Card>
  );
}

/* ---------------- Section card (titled container) ---------------- */

export function SectionCard({
  title,
  subtitle,
  right,
  className = "",
  bodyClassName,
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotionSafe();
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={reduce ? { duration: 0 } : { duration: DURATION.slow, ease: EASE_OUT }}
      className={cn("h-full", className)}
    >
      <Card padding="lg" className="h-full rounded-[var(--radius-xl)]">
        {(title || right) && (
          <CardHeader>
            <div className="min-w-0">
              {title && <CardTitle>{title}</CardTitle>}
              {subtitle && <CardDescription>{subtitle}</CardDescription>}
            </div>
            {right}
          </CardHeader>
        )}
        <div className={bodyClassName}>{children}</div>
      </Card>
    </motion.section>
  );
}

export function SectionCardSkeleton({ height = 240 }: { height?: number }) {
  return (
    <Card padding="lg" className="h-full rounded-[var(--radius-xl)]">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-3 w-48" />
      <Skeleton className="mt-5 w-full" style={{ height }} />
    </Card>
  );
}

/* ---------------- Ranked horizontal bar list ---------------- */

const PALETTE = [
  "var(--indigo)", "var(--violet)", "var(--teal)", "var(--amber)",
  "var(--coral)", "var(--pink)", "var(--indigo)", "var(--violet)",
];

export function BarList({
  items,
  valueFormat,
  emptyMessage = "No data yet.",
  onSelect,
  selected,
}: {
  items: { label: string; value: number; hint?: string }[];
  valueFormat?: (v: number) => string;
  emptyMessage?: string;
  /** Makes rows selectable — used to cross-filter from a chart. */
  onSelect?: (label: string) => void;
  selected?: string | null;
}) {
  const reduce = useReducedMotionSafe();
  if (!items || items.length === 0) {
    return <p className="text-sm text-[var(--ink-3)]">{emptyMessage}</p>;
  }
  const max = Math.max(...items.map((i) => i.value)) || 1;

  return (
    <ul className="space-y-3">
      {items.map((it, i) => {
        const isSelected = selected != null && selected === it.label;
        const row = (
          <>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="truncate pr-3 font-medium text-[var(--ink)]">{it.label}</span>
              <span className="shrink-0 tabular-nums text-[var(--ink-2)]">
                {valueFormat ? valueFormat(it.value) : it.value.toLocaleString()}
                {it.hint && <span className="ml-1.5 text-[var(--ink-3)]">{it.hint}</span>}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--line)]">
              <motion.div
                initial={reduce ? false : { width: 0 }}
                whileInView={{ width: `${(it.value / max) * 100}%` }}
                viewport={{ once: true }}
                transition={reduce ? { duration: 0 } : { duration: 0.7, delay: i * 0.05, ease: EASE_OUT }}
                className="h-full rounded-full"
                style={{ background: PALETTE[i % PALETTE.length] }}
              />
            </div>
          </>
        );

        return (
          <li key={it.label + i}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(it.label)}
                aria-pressed={isSelected}
                className={cn(
                  "w-full rounded-[var(--radius-sm)] px-1.5 py-1 text-left transition-colors",
                  "outline-none hover:bg-[var(--page)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                  isSelected && "bg-[var(--page)] ring-1 ring-[var(--accent)]/30"
                )}
              >
                {row}
              </button>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------- Empty state ---------------- */

/**
 * Empty states that teach rather than apologise: what this panel will show,
 * and the one action that fills it. "No data available" tells the user nothing
 * they didn't already know from looking at the blank card.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-10 text-center", className)}>
      {icon && (
        <div className="mb-3 flex size-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)]/10 text-[var(--accent)]">
          {icon}
        </div>
      )}
      <p className="font-semibold text-[var(--ink)]">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-[var(--ink-2)]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export { PALETTE };
