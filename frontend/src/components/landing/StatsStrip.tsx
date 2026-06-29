"use client";

import { motion } from "framer-motion";
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
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
        >
          <p className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em]" style={{ color: stat.color }}>
            <CountUp value={stat.value} decimals={stat.decimals} suffix={stat.suffix} separator={stat.separator} />
          </p>
          <p className="text-sm text-[var(--ink-2)] mt-1">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
