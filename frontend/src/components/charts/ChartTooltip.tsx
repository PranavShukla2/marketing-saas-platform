"use client";

import * as React from "react";

type Entry = {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
};

/**
 * Recharts' default tooltip is a white box with a 1px grey border, set inline
 * — so it stays white on a dark page and ignores our radius and elevation
 * scales. Passing `contentStyle` everywhere got us halfway there and had to be
 * repeated per chart; this replaces the whole surface instead, which means
 * tooltips pick up theme changes for free.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  labelFormat,
  valueFormat,
}: {
  active?: boolean;
  payload?: Entry[];
  label?: string | number;
  labelFormat?: (label: string | number) => string;
  valueFormat?: (value: number, entry: Entry) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow-overlay)]"
      // Recharts positions the tooltip absolutely; this just stops long series
      // names from stretching it across the chart.
      style={{ minWidth: 120, maxWidth: 260 }}
    >
      {label !== undefined && label !== "" && (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">
          {labelFormat ? labelFormat(label) : label}
        </p>
      )}
      <ul className="mt-1 space-y-1">
        {payload.map((entry, i) => {
          const n = typeof entry.value === "string" ? parseFloat(entry.value) : entry.value ?? 0;
          return (
            <li key={i} className="flex items-center justify-between gap-4 text-xs">
              <span className="flex min-w-0 items-center gap-1.5 text-[var(--ink-2)]">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: entry.color || "var(--accent)" }}
                />
                <span className="truncate capitalize">{entry.name ?? entry.dataKey}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-[var(--ink)]">
                {valueFormat ? valueFormat(Number.isNaN(n) ? 0 : n, entry) : (Number.isNaN(n) ? entry.value : n?.toLocaleString())}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
