"use client";

import Reveal from "../motion/Reveal";
import CountUp from "./CountUp";

const STATS = [
  { value: 1200, suffix: "+", decimals: 0, separator: true, label: "Workspaces created", color: "var(--indigo)" },
  { value: 4.2, suffix: "M+", decimals: 1, separator: false, label: "Data points processed", color: "var(--violet)" },
  { value: 99.9, suffix: "%", decimals: 1, separator: false, label: "Uptime SLA", color: "var(--teal)" },
  { value: 6, suffix: "", decimals: 0, separator: false, label: "Integrations", color: "var(--coral)" },
];

export default function StatsStrip() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-5xl mx-auto px-6 text-center">
      {STATS.map((stat, i) => (
        <Reveal key={stat.label} delay={i * 0.1}>
          <p className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em]" style={{ color: stat.color }}>
            <CountUp value={stat.value} decimals={stat.decimals} suffix={stat.suffix} separator={stat.separator} />
          </p>
          <p className="text-sm text-[var(--ink-2)] mt-1">{stat.label}</p>
        </Reveal>
      ))}
    </div>
  );
}
