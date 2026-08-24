"use client";

import { AreaTrend, DonutBreakdown } from "../../../components/charts";

const trend = Array.from({ length: 14 }, (_, i) => ({
  day: `Day ${i + 1}`,
  users: 900 + Math.round(Math.sin(i / 2) * 220) + i * 40,
  sessions: 1200 + Math.round(Math.cos(i / 3) * 260) + i * 55,
}));

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
          { key: "users", label: "Users", color: "var(--indigo)" },
          { key: "sessions", label: "Sessions", color: "var(--teal)" },
        ]}
        height={220}
      />
      <DonutBreakdown data={devices} nameKey="device" valueKey="users" />
    </div>
  );
}
