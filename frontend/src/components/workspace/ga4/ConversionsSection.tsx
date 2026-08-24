"use client";

import { motion } from "framer-motion";
import { KpiCard, PALETTE, SectionCard } from "../primitives";
import { DataTable } from "../DataTable";
import { EASE_OUT } from "../../../lib/motion";
import { useReducedMotionSafe } from "../../../lib/useReducedMotionSafe";
import { fmtMoney, fmtNum, toNum, type Ga4View } from "./shared";

export function ConversionsSection({ view }: { view: Ga4View }) {
  const s = view.summary ?? {};
  const reduce = useReducedMotionSafe();
  const funnel = view.funnel_data ?? [];
  const top = funnel[0]?.count || 1;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard index={0} label="Conversions" value={toNum(s.conversions)} color="var(--indigo)" />
        <KpiCard index={1} label="Transactions" value={toNum(s.transactions)} color="var(--violet)" />
        <KpiCard index={2} label="Revenue" value={toNum(s.total_revenue)} format={fmtMoney} color="var(--teal)" />
        <KpiCard index={3} label="Engaged Sessions" value={toNum(s.engaged_sessions)} color="var(--coral)" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title="Conversion funnel" subtitle="From first view to purchase">
          {funnel.length === 0 ? (
            <p className="text-sm text-[var(--ink-3)]">No funnel data yet.</p>
          ) : (
            <ol className="space-y-3">
              {funnel.map((f, i) => {
                const pct = Math.round((f.count / top) * 100);
                const dropOff = i > 0 ? Math.round(((funnel[i - 1].count - f.count) / (funnel[i - 1].count || 1)) * 100) : 0;
                return (
                  <li key={f.step}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-[var(--ink)]">{f.step}</span>
                      <span className="tabular-nums text-[var(--ink-2)]">
                        {fmtNum(f.count)} <span className="text-[var(--ink-3)]">· {pct}%</span>
                      </span>
                    </div>
                    <div className="h-7 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--line)]">
                      <motion.div
                        initial={reduce ? false : { width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={reduce ? { duration: 0 } : { duration: 0.7, delay: i * 0.08, ease: EASE_OUT }}
                        className="h-full rounded-[var(--radius-sm)]"
                        style={{ background: PALETTE[i % PALETTE.length] }}
                      />
                    </div>
                    {/* The step-to-step drop is the number worth acting on; the
                        cumulative percentage alone hides where people leave. */}
                    {i > 0 && dropOff > 0 && (
                      <p className="mt-1 text-[11px] text-[var(--ink-3)]">−{dropOff}% from the previous step</p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </SectionCard>

        <SectionCard title="Top products" subtitle="By revenue">
          <DataTable
            rows={view.ecommerce_data ?? []}
            getKey={(p) => p.name}
            defaultSort={{ key: "revenue", direction: "desc" }}
            emptyMessage="No purchases recorded yet."
            columns={[
              { key: "name", header: "Product", cell: (p) => <span className="font-medium text-[var(--ink)]">{p.name}</span>, sortBy: (p) => p.name },
              { key: "purchases", header: "Purchases", align: "right", cell: (p) => fmtNum(p.purchases), sortBy: (p) => p.purchases },
              { key: "revenue", header: "Revenue", align: "right", cell: (p) => <span className="font-semibold text-[var(--ink)]">{fmtMoney(p.revenue)}</span>, sortBy: (p) => p.revenue },
            ]}
          />
        </SectionCard>
      </div>
    </div>
  );
}
