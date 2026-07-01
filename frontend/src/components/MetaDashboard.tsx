"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { KpiCard, SectionCard, BarList } from "./workspace/primitives";
import { metaDemo, type MetaData } from "../lib/metaDemoData";

const FB = "#1877F2";
const IG = "#E1306C";
const cardTip = { borderRadius: 14, border: "1px solid var(--line)", boxShadow: "0 10px 30px rgba(20,18,46,.1)", fontSize: 12 };
const GENDER_COLORS = ["var(--violet)", "var(--indigo)", "var(--teal)"];

const SUBTABS = [
  { id: "facebook", label: "Facebook", color: FB },
  { id: "instagram", label: "Instagram", color: IG },
  { id: "ads", label: "Ads", color: "var(--violet)" },
];

export default function MetaDashboard({ data }: { data?: MetaData }) {
  const view = data ?? metaDemo;
  const isDemo = !data;
  const [sub, setSub] = useState("facebook");

  const fb = view.facebook;
  const ig = view.instagram;
  const ads = view.ads;

  return (
    <div className="space-y-6">
      {/* sub-tab switcher */}
      <div className="flex items-center gap-3 flex-wrap sm:justify-between">
        <div className="inline-flex gap-1 bg-white border border-[var(--line)] p-1 rounded-2xl shadow-sm">
          {SUBTABS.map((t) => {
            const active = sub === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSub(t.id)}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-colors ${active ? "text-white" : "text-[var(--ink-2)] hover:text-[var(--ink)]"}`}
              >
                {active && <motion.div layoutId="meta-subtab" className="absolute inset-0 rounded-xl" style={{ background: t.color }} transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>
        {isDemo && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(245,166,35,.14)] text-[var(--amber)]">
            Sample data · connect Meta for live numbers
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={sub} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-6">

          {/* ===== FACEBOOK ===== */}
          {sub === "facebook" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard index={0} label="Followers" value={fb.summary.followers} color={FB} spark={fb.trend.map((t) => t.reach)} />
                <KpiCard index={1} label="Reach" value={fb.summary.reach} color={FB} spark={fb.trend.map((t) => t.reach)} />
                <KpiCard index={2} label="Impressions" value={fb.summary.impressions} color="var(--indigo)" spark={fb.trend.map((t) => t.impressions)} />
                <KpiCard index={3} label="Engagement Rate" value={fb.summary.engagement_rate} color="var(--teal)" />
                <KpiCard index={4} label="Post Reach" value={fb.summary.post_reach} color="var(--violet)" />
                <KpiCard index={5} label="Video Views" value={fb.summary.video_views} color="var(--coral)" />
                <KpiCard index={6} label="Page Views" value={fb.summary.page_views} color="var(--amber)" />
                <KpiCard index={7} label="Net New Followers" value={fb.summary.net_new_followers} color="var(--teal)" />
              </div>

              <SectionCard title="Reach & engagement" subtitle="Last 30 days">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fb.trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fbReach" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={FB} stopOpacity="0.25" /><stop offset="1" stopColor={FB} stopOpacity="0" /></linearGradient>
                        <linearGradient id="fbEng" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--teal)" stopOpacity="0.2" /><stop offset="1" stopColor="var(--teal)" stopOpacity="0" /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--ink-3)" }} interval={4} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--ink-3)" }} tickLine={false} axisLine={false} width={40} />
                      <Tooltip contentStyle={cardTip} />
                      <Area type="monotone" dataKey="reach" stroke={FB} strokeWidth={2.5} fill="url(#fbReach)" />
                      <Area type="monotone" dataKey="engagement" stroke="var(--teal)" strokeWidth={2} fill="url(#fbEng)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard title="Top posts" subtitle="By reach">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead><tr className="text-[11px] uppercase tracking-wider text-[var(--ink-3)] text-left"><th className="pb-3 font-semibold">Post</th><th className="pb-3 font-semibold">Type</th><th className="pb-3 font-semibold text-right">Reach</th><th className="pb-3 font-semibold text-right">Reactions</th><th className="pb-3 font-semibold text-right">Comments</th><th className="pb-3 font-semibold text-right">Shares</th></tr></thead>
                    <tbody>
                      {fb.top_posts.map((p, i) => (
                        <tr key={i} className="border-t border-[var(--line)]">
                          <td className="py-3 font-medium text-[var(--ink)] max-w-[220px] truncate">{p.title}</td>
                          <td className="py-3 text-[var(--ink-3)]">{p.type}</td>
                          <td className="py-3 text-right tabular-nums">{p.reach.toLocaleString()}</td>
                          <td className="py-3 text-right text-[var(--ink-2)] tabular-nums">{p.reactions.toLocaleString()}</td>
                          <td className="py-3 text-right text-[var(--ink-2)] tabular-nums">{p.comments}</td>
                          <td className="py-3 text-right text-[var(--ink-2)] tabular-nums">{p.shares}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SectionCard title="Age"><BarList items={fb.age.map((a) => ({ label: a.bucket, value: a.value }))} valueFormat={(v) => `${v}%`} /></SectionCard>
                <SectionCard title="Gender"><GenderSplit data={fb.gender} /></SectionCard>
                <SectionCard title="Top countries"><BarList items={fb.countries.map((c) => ({ label: c.country, value: c.value }))} /></SectionCard>
              </div>
            </>
          )}

          {/* ===== INSTAGRAM ===== */}
          {sub === "instagram" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard index={0} label="Followers" value={ig.summary.followers} color={IG} spark={ig.trend.map((t) => t.followers)} />
                <KpiCard index={1} label="Reach" value={ig.summary.reach} color={IG} spark={ig.trend.map((t) => t.reach)} />
                <KpiCard index={2} label="Profile Views" value={ig.summary.profile_views} color="var(--violet)" />
                <KpiCard index={3} label="Engagement" value={ig.summary.engagement} color="var(--teal)" />
                <KpiCard index={4} label="Saves" value={ig.summary.saves} color="var(--coral)" />
                <KpiCard index={5} label="Reels Plays" value={ig.summary.reels_plays} color={IG} spark={ig.trend.map((t) => t.engagement)} />
                <KpiCard index={6} label="Website Taps" value={ig.summary.website_taps} color="var(--amber)" />
                <KpiCard index={7} label="Accounts Engaged" value={ig.summary.accounts_engaged} color="var(--indigo)" />
              </div>

              <SectionCard title="Follower growth & reach" subtitle="Last 30 days">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ig.trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="igReach" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={IG} stopOpacity="0.25" /><stop offset="1" stopColor={IG} stopOpacity="0" /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--ink-3)" }} interval={4} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--ink-3)" }} tickLine={false} axisLine={false} width={40} />
                      <Tooltip contentStyle={cardTip} />
                      <Area type="monotone" dataKey="reach" stroke={IG} strokeWidth={2.5} fill="url(#igReach)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard title="Top content" subtitle="Reels, carousels & posts by reach">
                <div className="space-y-3">
                  {ig.top_posts.map((p, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-[var(--line)]">
                      <span className="text-[11px] font-semibold px-2 py-1 rounded-md flex-shrink-0" style={{ background: "rgba(225,48,108,.1)", color: IG }}>{p.type}</span>
                      <p className="flex-1 text-sm text-[var(--ink)] truncate">{p.caption}</p>
                      <div className="hidden sm:flex items-center gap-5 text-xs text-[var(--ink-2)] flex-shrink-0">
                        <span>❤ {p.likes.toLocaleString()}</span>
                        <span>💬 {p.comments}</span>
                        <span>🔖 {p.saves.toLocaleString()}</span>
                        <span className="font-semibold text-[var(--ink)]">{p.reach.toLocaleString()} reach</span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SectionCard title="Age"><BarList items={ig.age.map((a) => ({ label: a.bucket, value: a.value }))} valueFormat={(v) => `${v}%`} /></SectionCard>
                <SectionCard title="Gender"><GenderSplit data={ig.gender} /></SectionCard>
                <SectionCard title="Top cities"><BarList items={ig.cities.map((c) => ({ label: c.city, value: c.value }))} /></SectionCard>
              </div>
            </>
          )}

          {/* ===== ADS ===== */}
          {sub === "ads" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard index={0} label="Spend" value={ads.summary.spend} color="var(--violet)" spark={ads.trend.map((t) => t.spend)} />
                <KpiCard index={1} label="Impressions" value={ads.summary.impressions} color="var(--indigo)" />
                <KpiCard index={2} label="Clicks" value={ads.summary.clicks} color="var(--teal)" />
                <KpiCard index={3} label="ROAS" value={ads.summary.roas} color="var(--coral)" />
                <KpiCard index={4} label="CTR" value={ads.summary.ctr} color="var(--indigo)" />
                <KpiCard index={5} label="CPC" value={ads.summary.cpc} color="var(--violet)" />
                <KpiCard index={6} label="Conversions" value={ads.summary.conversions} color="var(--teal)" spark={ads.trend.map((t) => t.conversions)} />
                <KpiCard index={7} label="Frequency" value={ads.summary.frequency} color="var(--amber)" />
              </div>

              <SectionCard title="Spend & conversions" subtitle="Last 30 days">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ads.trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="adSpend" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--violet)" stopOpacity="0.25" /><stop offset="1" stopColor="var(--violet)" stopOpacity="0" /></linearGradient>
                        <linearGradient id="adConv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--teal)" stopOpacity="0.22" /><stop offset="1" stopColor="var(--teal)" stopOpacity="0" /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--ink-3)" }} interval={4} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--ink-3)" }} tickLine={false} axisLine={false} width={40} />
                      <Tooltip contentStyle={cardTip} />
                      <Area type="monotone" dataKey="spend" stroke="var(--violet)" strokeWidth={2.5} fill="url(#adSpend)" />
                      <Area type="monotone" dataKey="conversions" stroke="var(--teal)" strokeWidth={2} fill="url(#adConv)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard title="Campaigns" subtitle="Performance breakdown">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead><tr className="text-[11px] uppercase tracking-wider text-[var(--ink-3)] text-left"><th className="pb-3 font-semibold">Campaign</th><th className="pb-3 font-semibold text-right">Spend</th><th className="pb-3 font-semibold text-right">Impr.</th><th className="pb-3 font-semibold text-right">Clicks</th><th className="pb-3 font-semibold text-right">CTR</th><th className="pb-3 font-semibold text-right">Conv.</th><th className="pb-3 font-semibold text-right">ROAS</th></tr></thead>
                    <tbody>
                      {ads.campaigns.map((c, i) => (
                        <tr key={i} className="border-t border-[var(--line)]">
                          <td className="py-3 font-medium text-[var(--ink)]">{c.name}</td>
                          <td className="py-3 text-right tabular-nums">${c.spend.toLocaleString()}</td>
                          <td className="py-3 text-right text-[var(--ink-2)] tabular-nums">{c.impressions.toLocaleString()}</td>
                          <td className="py-3 text-right text-[var(--ink-2)] tabular-nums">{c.clicks.toLocaleString()}</td>
                          <td className="py-3 text-right text-[var(--ink-2)] tabular-nums">{c.ctr}</td>
                          <td className="py-3 text-right text-[var(--ink-2)] tabular-nums">{c.conversions}</td>
                          <td className="py-3 text-right font-semibold tabular-nums" style={{ color: "var(--teal)" }}>{c.roas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function GenderSplit({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div className="flex items-center gap-5">
      <div className="w-32 h-32 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3}>
              {data.map((_, i) => <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid var(--line)", fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2">
        {data.map((g, i) => (
          <div key={g.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-[var(--ink-2)]"><span className="w-2.5 h-2.5 rounded-full" style={{ background: GENDER_COLORS[i % GENDER_COLORS.length] }} />{g.label}</span>
            <span className="font-medium tabular-nums">{g.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
