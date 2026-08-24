"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { cn } from "../../lib/cn";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";

export const CATEGORY_COLORS = [
  "var(--indigo)", "var(--violet)", "var(--teal)", "var(--amber)",
  "var(--coral)", "var(--pink)",
];

/**
 * Donut plus an inline legend that carries the numbers.
 *
 * The legend doubles as the accessible reading of the chart: a `<figure>` with
 * the ring marked `aria-hidden` and the figures in a real list, so a screen
 * reader gets "Mobile, 18,420, 54%" rather than an unlabelled SVG.
 */
export function DonutBreakdown({
  data,
  nameKey,
  valueKey,
  colors = CATEGORY_COLORS,
  valueFormat = (v: number) => v.toLocaleString(),
  size = 168,
  className,
}: {
  data: Record<string, unknown>[];
  nameKey: string;
  valueKey: string;
  colors?: string[];
  valueFormat?: (v: number) => string;
  size?: number;
  className?: string;
}) {
  const reduce = useReducedMotionSafe();
  const rows = data ?? [];
  const total = rows.reduce((sum, r) => sum + Number(r[valueKey] ?? 0), 0) || 1;

  if (rows.length === 0) {
    return <p className="text-sm text-[var(--ink-3)]">No data yet.</p>;
  }

  return (
    <figure className={cn("flex flex-wrap items-center gap-6", className)}>
      <div aria-hidden="true" className="shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey={valueKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="96%"
              paddingAngle={3}
              // A ring that grows from nothing is disorienting; sweeping the
              // segments in around the circle reads as the chart drawing.
              isAnimationActive={!reduce}
              animationDuration={650}
              stroke="var(--surface)"
              strokeWidth={2}
            >
              {rows.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip valueFormat={(v) => valueFormat(v)} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <figcaption className="min-w-[10rem] flex-1 space-y-2">
        {rows.map((r, i) => {
          const v = Number(r[valueKey] ?? 0);
          return (
            <div key={String(r[nameKey]) + i} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-[var(--ink-2)]">
                <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: colors[i % colors.length] }} />
                <span className="truncate">{String(r[nameKey])}</span>
              </span>
              <span className="shrink-0 tabular-nums text-[var(--ink)]">
                <span className="font-medium">{valueFormat(v)}</span>
                <span className="ml-1.5 text-[var(--ink-3)]">{Math.round((v / total) * 100)}%</span>
              </span>
            </div>
          );
        })}
      </figcaption>
    </figure>
  );
}
