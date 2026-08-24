"use client";

import * as React from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { cn } from "../../lib/cn";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";

export type Series = {
  key: string;
  label: string;
  color: string;
  /** Stack this series with the others that share a stack id. */
  stackId?: string;
};

/**
 * The dashboard's trend chart.
 *
 * Every area chart in the workspace was ~30 lines of recharts with its own
 * hand-numbered gradient ids (`gUsers`, `gNew`, `gRet`…), which collide the
 * moment two charts share a page — SVG gradient ids are document-global, so
 * the second chart silently repaints with the first one's fill. Ids are
 * derived from a `useId()` here, so that can't happen.
 */
export function AreaTrend({
  data,
  xKey,
  series,
  height = 288,
  legend = true,
  labelFormat,
  valueFormat,
  className,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: Series[];
  height?: number;
  legend?: boolean;
  labelFormat?: (label: string | number) => string;
  valueFormat?: (value: number) => string;
  className?: string;
}) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduce = useReducedMotionSafe();
  const gid = (key: string) => `af-${uid}-${key.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className={cn("w-full", className)}>
      {legend && (
        <ul className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5 text-xs text-[var(--ink-2)]">
              <span aria-hidden="true" className="size-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={gid(s.key)} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={s.color} stopOpacity="0.26" />
                  <stop offset="1" stopColor={s.color} stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 10, fill: "var(--ink-3)" }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--ink-3)" }}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v))}
            />
            <Tooltip
              cursor={{ stroke: "var(--ink-3)", strokeWidth: 1, strokeDasharray: "3 3" }}
              content={<ChartTooltip labelFormat={labelFormat} valueFormat={valueFormat ? (v) => valueFormat(v) : undefined} />}
            />
            {series.map((s, i) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stackId={s.stackId}
                stroke={s.color}
                strokeWidth={2.25}
                fill={`url(#${gid(s.key)})`}
                // The reveal is a left-to-right clip, so the line looks drawn
                // rather than faded. Off entirely under reduced motion.
                isAnimationActive={!reduce}
                animationDuration={700}
                animationBegin={i * 90}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
