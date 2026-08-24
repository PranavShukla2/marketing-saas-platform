"use client";

import { BarList, KpiCard, SectionCard } from "../primitives";
import { delta, fmtNum, toNum, type Ga4View } from "./shared";

export function AcquisitionSection({ view }: { view: Ga4View }) {
  const s = view.summary ?? {};
  const sessionsSeries = (view.time_series ?? []).map((d) => d.sessions);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard index={0} label="Sessions" value={toNum(s.sessions)} delta={delta(sessionsSeries)} spark={sessionsSeries} color="var(--indigo)" />
        <KpiCard index={1} label="New Users" value={toNum(s.new_users)} color="var(--violet)" />
        <KpiCard index={2} label="Channels" value={(view.channel_data ?? []).length} color="var(--teal)" hint="Distinct channel groupings" />
        <KpiCard index={3} label="Top Source" value={view.post_level?.[0]?.source ?? "—"} color="var(--coral)" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title="Channels" subtitle="Default channel grouping">
          <BarList
            items={(view.channel_data ?? []).map((c) => ({ label: c.channel, value: c.users, hint: `· ${fmtNum(c.sessions)} sess` }))}
            emptyMessage="No channel data for this period yet."
          />
        </SectionCard>
        <SectionCard title="Top sources" subtitle="Referrers by users">
          <BarList
            items={(view.post_level ?? []).map((p) => ({ label: p.source, value: p.users, hint: `· ${fmtNum(p.views)} views` }))}
            emptyMessage="No referrers recorded yet."
          />
        </SectionCard>
      </div>
    </div>
  );
}
