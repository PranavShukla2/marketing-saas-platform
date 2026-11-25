"use client";

import { useState } from "react";
import { Badge, Tabs, TabsList, TabsTrigger } from "./ui";
import { AreaTrend } from "./charts";
import { BarList, KpiCard, SectionCard } from "./workspace/primitives";
import { linkedinDemo, type LinkedInData } from "../lib/linkedinDemoData";

/**
 * The LinkedIn tab, rebuilt to the same standard as GA4 and Meta: a KPI band,
 * a 30-day trend, top content, and audience splits for the Page; spend, leads
 * and a campaign table for Ads. It reads the same primitives and chart
 * wrapper as the rest of the workspace, in LinkedIn's source colour.
 *
 * The integration isn't built yet, so it runs on labelled sample data — and
 * takes an optional `data` prop so a live payload drops straight in.
 */

const LI = "var(--source-linkedin)";
const nf = new Intl.NumberFormat("en-US");
const usd = (n: number) => `$${nf.format(n)}`;

export default function LinkedInDashboard({ data }: { data?: LinkedInData }) {
  const view = data ?? linkedinDemo;
  const isDemo = !data;
  const [sub, setSub] = useState<"page" | "ads">("page");
  const p = view.page;
  const a = view.ads;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 sm:justify-between">
        <Tabs panels={false} group="linkedin" value={sub} onValueChange={(v) => setSub(v as "page" | "ads")}>
          <TabsList>
            <TabsTrigger value="page">Company Page</TabsTrigger>
            <TabsTrigger value="ads">Ads</TabsTrigger>
          </TabsList>
        </Tabs>
        {isDemo && <Badge tone="warning">Sample data · LinkedIn integration coming soon</Badge>}
      </div>

      {sub === "page" ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard index={0} label="Followers" value={p.summary.followers} spark={p.trend.map((t) => t.followers)} color={LI} />
            <KpiCard index={1} label="New followers" value={p.summary.new_followers} color={LI} hint="Last 30 days" />
            <KpiCard index={2} label="Impressions" value={p.summary.impressions} spark={p.trend.map((t) => t.impressions)} color="var(--unified)" />
            <KpiCard index={3} label="Page views" value={p.summary.page_views} color="var(--indigo)" />
            <KpiCard index={4} label="Unique visitors" value={p.summary.unique_visitors} color="var(--indigo)" />
            <KpiCard index={5} label="Engagement rate" value={p.summary.engagement_rate} color="var(--pink)" />
          </div>

          <SectionCard title="Impressions" subtitle="Organic page updates, last 30 days">
            <AreaTrend
              data={p.trend}
              xKey="date"
              height={260}
              legend={false}
              series={[{ key: "impressions", label: "Impressions", color: LI }]}
            />
          </SectionCard>

          <SectionCard title="Top posts" subtitle="By impressions">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--ink-3)]">
                    <th className="pb-3 font-semibold">Post</th>
                    <th className="pb-3 text-right font-semibold">Impressions</th>
                    <th className="pb-3 text-right font-semibold">Clicks</th>
                    <th className="pb-3 text-right font-semibold">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {p.top_posts.map((t) => (
                    <tr key={t.title} className="border-t border-[var(--line)]">
                      <td className="py-3 pr-4 font-medium text-[var(--ink)]">{t.title}</td>
                      <td className="py-3 text-right tabular-nums text-[var(--ink-2)]">{nf.format(t.impressions)}</td>
                      <td className="py-3 text-right tabular-nums text-[var(--ink-2)]">{nf.format(t.clicks)}</td>
                      <td className="py-3 text-right font-medium tabular-nums text-[var(--ink)]">{t.engagement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <div className="grid gap-5 lg:grid-cols-3">
            <SectionCard title="Job function" subtitle="Share of visitors">
              <BarList items={p.job_functions} valueFormat={(v) => `${v}%`} />
            </SectionCard>
            <SectionCard title="Seniority" subtitle="Share of visitors">
              <BarList items={p.seniority} valueFormat={(v) => `${v}%`} />
            </SectionCard>
            <SectionCard title="Industry" subtitle="Share of visitors">
              <BarList items={p.industries} valueFormat={(v) => `${v}%`} />
            </SectionCard>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard index={0} label="Spend" value={a.summary.spend} format={usd} spark={a.trend.map((t) => t.spend)} color={LI} />
            <KpiCard index={1} label="Leads" value={a.summary.leads} spark={a.trend.map((t) => t.leads)} color="var(--unified)" />
            <KpiCard index={2} label="Cost per lead" value={a.summary.cost_per_lead} color="var(--indigo)" />
            <KpiCard index={3} label="Conversions" value={a.summary.conversions} color="var(--pink)" />
            <KpiCard index={4} label="Impressions" value={a.summary.impressions} color="var(--indigo)" />
            <KpiCard index={5} label="Clicks" value={a.summary.clicks} color={LI} />
            <KpiCard index={6} label="CTR" value={a.summary.ctr} color="var(--unified)" />
            <KpiCard index={7} label="CPC" value={a.summary.cpc} color="var(--indigo)" />
          </div>

          <SectionCard title="Spend and leads" subtitle="Last 30 days">
            <AreaTrend
              data={a.trend}
              xKey="date"
              height={260}
              series={[
                { key: "spend", label: "Spend ($)", color: LI },
                { key: "leads", label: "Leads", color: "var(--unified)" },
              ]}
            />
          </SectionCard>

          <SectionCard title="Campaigns" subtitle="Performance, last 30 days">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--ink-3)]">
                    <th className="pb-3 font-semibold">Campaign</th>
                    <th className="pb-3 font-semibold">Objective</th>
                    <th className="pb-3 text-right font-semibold">Spend</th>
                    <th className="pb-3 text-right font-semibold">Impr.</th>
                    <th className="pb-3 text-right font-semibold">CTR</th>
                    <th className="pb-3 text-right font-semibold">Leads</th>
                    <th className="pb-3 text-right font-semibold">CPL</th>
                  </tr>
                </thead>
                <tbody>
                  {a.campaigns.map((c) => (
                    <tr key={c.name} className="border-t border-[var(--line)]">
                      <td className="py-3 pr-4 font-medium text-[var(--ink)]">{c.name}</td>
                      <td className="py-3 pr-4 text-[var(--ink-2)]">{c.objective}</td>
                      <td className="py-3 text-right tabular-nums">{usd(c.spend)}</td>
                      <td className="py-3 text-right tabular-nums text-[var(--ink-2)]">{nf.format(c.impressions)}</td>
                      <td className="py-3 text-right tabular-nums text-[var(--ink-2)]">{c.ctr}</td>
                      <td className="py-3 text-right tabular-nums text-[var(--ink-2)]">{c.leads}</td>
                      <td className="py-3 text-right font-medium tabular-nums text-[var(--ink)]">{c.cpl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
