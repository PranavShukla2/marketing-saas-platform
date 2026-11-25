"use client";

import { AreaTrend, DonutBreakdown } from "../../../components/charts";

const trend = Array.from({ length: 14 }, (_, i) => ({
  day: `Day ${i + 1}`,
  users: 900 + Math.round(Math.sin(i / 2) * 220) + i * 40,
  sessions: 1200 + Math.round(Math.cos(i / 3) * 260) + i * 55,
}));

// The anomaly marker: the same 19-day baseline (mean 1,745) and 1,204 dip the
// landing's Ripples act uses, which the real detector would flag; the last
// point is "today", partial, exactly as in the workspace.
const BASE = [1690, 1760, 1825, 1790, 1705, 1580, 1620, 1735, 1810, 1870, 1820, 1730, 1610, 1655, 1760, 1840, 1890, 1795, 1670];
const anomalyTrend = [...BASE, 1204, 640].map((sessions, i) => ({ day: `Nov ${i + 4}`, sessions }));

const devices = [
  { device: "Mobile", users: 18420 },
  { device: "Desktop", users: 11260 },
  { device: "Tablet", users: 2140 },
];

/**
 * Charts are split out and loaded on demand: recharts is ~1.4MB raw, and the
 * reference route shouldn't drag it onto the marketing bundle just to show two
 * examples.
 */
export default function ChartShowcase() {
  return (
    <div className="space-y-6">
      <AreaTrend
        data={trend}
        xKey="day"
        series={[
          { key: "users", label: "Users", color: "var(--unified)" },
          { key: "sessions", label: "Sessions", color: "var(--teal)" },
        ]}
        height={220}
      />
      <div>
        <p className="mb-2 text-xs font-medium text-[var(--ink-2)]">With an anomaly — the coral ripple, and only for an anomaly</p>
        <AreaTrend
          data={anomalyTrend}
          xKey="day"
          legend={false}
          series={[{ key: "sessions", label: "Sessions", color: "var(--unified)" }]}
          height={200}
          marker={{ index: anomalyTrend.length - 2, seriesKey: "sessions", label: "Sessions on Nov 23 came in at 1,204 — 31% below your recent daily average of 1,745." }}
        />
      </div>
      <DonutBreakdown data={devices} nameKey="device" valueKey="users" />
    </div>
  );
}
