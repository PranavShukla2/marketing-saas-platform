"use client";

import { BarList, KpiCard, SectionCard } from "../primitives";
import { DataTable } from "../DataTable";
import { delta, fmtNum, toNum, type Ga4View } from "./shared";

export function BehaviorSection({ view }: { view: Ga4View }) {
  const s = view.summary ?? {};
  const viewsSeries = (view.time_series ?? []).map((d) => d.views);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard index={0} label="Page Views" value={toNum(s.page_views)} delta={delta(viewsSeries)} spark={viewsSeries} color="var(--indigo)" />
        <KpiCard index={1} label="Views / Session" value={s.views_per_session || "—"} color="var(--violet)" />
        <KpiCard index={2} label="Total Events" value={toNum(s.events)} color="var(--teal)" />
        <KpiCard index={3} label="Avg. Duration" value={s.avg_duration || "—"} color="var(--coral)" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title="Top pages" subtitle="Most viewed paths">
          <DataTable
            rows={view.pages_data ?? []}
            getKey={(p) => p.path}
            emptyMessage="No page views recorded yet."
            columns={[
              { key: "path", header: "Path", cell: (p) => <span className="block max-w-[220px] truncate font-medium text-[var(--ink)]">{p.path}</span>, sortBy: (p) => p.path },
              { key: "views", header: "Views", align: "right", cell: (p) => fmtNum(p.views), sortBy: (p) => p.views },
              { key: "time", header: "Avg time", align: "right", cell: (p) => `${p.avg_duration}s`, sortBy: (p) => p.avg_duration },
            ]}
          />
        </SectionCard>
        <SectionCard title="Top events" subtitle="Event counts (30d)">
          <BarList items={(view.events_data ?? []).map((e) => ({ label: e.event, value: e.count }))} />
        </SectionCard>
      </div>
    </div>
  );
}
