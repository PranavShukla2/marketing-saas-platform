"use client";

import { Sparkles } from "lucide-react";
import { AreaTrend, DonutBreakdown } from "../../charts";
import { BarList, KpiCard, SectionCard } from "../primitives";
import { delta, fmtMoney, fmtNum, toNum, type Ga4View } from "./shared";

/**
 * The overview, as a bento board.
 *
 * Everything used to be a full-width row stacked vertically, so the trend chart
 * — the one panel people actually read — sat below the fold behind eight KPI
 * tiles. Composing it as a grid puts the trend, the channel mix and the device
 * split on one screen, with the tiles as a band across the top rather than a
 * wall. The spans are declared only from `lg` up; below that it stays a single
 * column, which is the right layout on a phone anyway.
 */
export function OverviewSection({ view }: { view: Ga4View }) {
  const ts = view.time_series ?? [];
  const usersSeries = ts.map((d) => d.users);
  const sessionsSeries = ts.map((d) => d.sessions);
  const viewsSeries = ts.map((d) => d.views);
  const s = view.summary ?? {};

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard index={0} label="Active Users" value={toNum(s.active_users)} delta={delta(usersSeries)} spark={usersSeries} color="var(--indigo)" hint="Last 30 days" />
        <KpiCard index={1} label="Sessions" value={toNum(s.sessions)} delta={delta(sessionsSeries)} spark={sessionsSeries} color="var(--violet)" hint="Last 30 days" />
        <KpiCard index={2} label="Page Views" value={toNum(s.page_views)} delta={delta(viewsSeries)} spark={viewsSeries} color="var(--teal)" hint="Last 30 days" />
        <KpiCard index={3} label="Conversions" value={toNum(s.conversions)} color="var(--coral)" hint="Key events, last 30 days" />
      </div>

      {/* The board: the trend takes two thirds, the rest fills in around it. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title="Traffic trend"
          subtitle="Users, sessions and views — last 30 days"
        >
          <AreaTrend
            data={ts as unknown as Record<string, unknown>[]}
            xKey="date"
            height={272}
            series={[
              { key: "users", label: "Users", color: "var(--indigo)" },
              { key: "sessions", label: "Sessions", color: "var(--violet)" },
              { key: "views", label: "Views", color: "var(--teal)" },
            ]}
          />
        </SectionCard>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-1">
          <KpiCard index={4} label="Engagement Rate" value={s.engagement_rate || "—"} color="var(--indigo)" />
          <KpiCard index={5} label="Avg. Duration" value={s.avg_duration || "—"} color="var(--violet)" />
          <KpiCard index={6} label="Bounce Rate" value={s.bounce_rate || "—"} color="var(--amber)" />
          <KpiCard index={7} label="Revenue" value={toNum(s.total_revenue)} format={fmtMoney} color="var(--teal)" />
        </div>

        <SectionCard className="lg:col-span-2" title="Top channels" subtitle="Where your users come from">
          <BarList
            items={(view.channel_data ?? []).slice(0, 6).map((c) => ({
              label: c.channel,
              value: c.users,
              hint: `· ${fmtNum(c.sessions)} sess`,
            }))}
            emptyMessage="No channel data for this period yet."
          />
        </SectionCard>

        <SectionCard title="Devices" subtitle="Users by device category">
          <DonutBreakdown data={view.device_data ?? []} nameKey="device" valueKey="users" size={150} />
        </SectionCard>
      </div>

      <SectionCard title="Flo's take" subtitle="Auto-generated insight">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--violet)]/12 text-[var(--violet)]">
            <Sparkles className="size-4" />
          </div>
          <div>
            <p className="font-semibold text-[var(--ink)]">{view.suggestions?.primary_focus}</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--ink-2)]">{view.suggestions?.reason}</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">
              <strong className="text-[var(--ink)]">Next move: </strong>
              {view.suggestions?.action_item}
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
