"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Globe, X } from "lucide-react";
import { AreaTrend } from "../../charts";
import { Button } from "../../ui";
import { BarList, EmptyState, KpiCard, SectionCard } from "../primitives";
import { delta, fmtNum, toNum, type Ga4View } from "./shared";

// d3-geo, topojson and the atlas fetch only exist for people who open this
// section, so they load with it rather than with the dashboard.
const GeoMap = dynamic(() => import("../GeoMap").then((m) => m.GeoMap), {
  ssr: false,
  loading: () => (
    <div className="w-full animate-pulse rounded-[var(--radius-lg)] bg-[var(--line)]" style={{ aspectRatio: "900 / 460" }} />
  ),
});

export function AudienceSection({ view }: { view: Ga4View }) {
  const s = view.summary ?? {};
  const ts = view.time_series ?? [];
  // Memoised because the `?? []` fallback is a fresh array on every render,
  // which would defeat the memo on the ranked list below.
  const geo = React.useMemo(() => view.geo_data ?? [], [view.geo_data]);

  // Selecting a country cross-filters the panel: the map highlights it and the
  // ranked list scrolls it to the top, so clicking a shape and reading the
  // figure are the same gesture.
  const [country, setCountry] = React.useState<string | null>(null);
  const selectedRow = country ? geo.find((g) => g.country === country) : undefined;

  const ranked = React.useMemo(() => {
    const rows = geo.slice(0, 10);
    if (!selectedRow || rows.some((r) => r.country === selectedRow.country)) return rows;
    // A country picked off the long tail wouldn't otherwise appear in a top-10
    // list — surface it rather than letting the click look like it did nothing.
    return [selectedRow, ...rows.slice(0, 9)];
  }, [geo, selectedRow]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard index={0} label="Active Users" value={toNum(s.active_users)} delta={delta(ts.map((d) => d.users))} spark={ts.map((d) => d.users)} color="var(--indigo)" />
        <KpiCard index={1} label="New Users" value={toNum(s.new_users)} color="var(--violet)" hint="First-time visitors" />
        <KpiCard index={2} label="Engaged Sessions" value={toNum(s.engaged_sessions)} color="var(--teal)" />
        <KpiCard index={3} label="Engagement Rate" value={s.engagement_rate || "—"} color="var(--coral)" />
      </div>

      <SectionCard
        title="Where your users are"
        subtitle={
          selectedRow
            ? `${selectedRow.country} — ${fmtNum(selectedRow.users)} users`
            : `${geo.length} ${geo.length === 1 ? "country" : "countries"} with traffic in the last 30 days`
        }
        right={
          selectedRow ? (
            <Button variant="ghost" size="sm" onClick={() => setCountry(null)}>
              <X />Clear
            </Button>
          ) : undefined
        }
      >
        {geo.length === 0 ? (
          <EmptyState
            icon={<Globe className="size-5" />}
            title="No geography yet"
            description="Once Google Analytics has recorded visits, this map shades each country by its share of your visitors."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(240px,1fr)]">
            <GeoMap rows={geo} selected={country} onSelect={setCountry} />
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">
                Top countries
              </p>
              {/* The ranked list is also the fallback the plan calls for: it
                  carries every country, including the microstates that have no
                  polygon at 1:110m and so can never be shaded. */}
              <BarList
                items={ranked.map((g) => ({ label: g.country, value: g.users, hint: `· ${fmtNum(g.sessions)} sess` }))}
                selected={country}
                onSelect={(label) => setCountry((c) => (c === label ? null : label))}
              />
            </div>
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" title="New vs returning" subtitle="Weekly user mix">
          <AreaTrend
            data={(view.cohort_data ?? []) as unknown as Record<string, unknown>[]}
            xKey="week"
            height={236}
            series={[
              { key: "new", label: "New", color: "var(--indigo)", stackId: "cohort" },
              { key: "returning", label: "Returning", color: "var(--violet)", stackId: "cohort" },
            ]}
          />
        </SectionCard>

        <SectionCard title="Browsers">
          <BarList items={(view.browser_data ?? []).map((b) => ({ label: b.browser, value: b.users }))} />
        </SectionCard>

        <SectionCard className="lg:col-span-3" title="Operating systems">
          <BarList items={(view.os_data ?? []).map((o) => ({ label: o.os, value: o.users }))} />
        </SectionCard>
      </div>
    </div>
  );
}
