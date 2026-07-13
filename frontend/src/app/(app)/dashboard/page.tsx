"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import dynamic from "next/dynamic";
import PlatformLoader from "../../../components/PlatformLoader";

// Heavy tabs load on demand — most sessions never open Meta/LinkedIn, and the
// PDF libs (~350KB) are only needed the moment someone clicks Export.
const MetaDashboard = dynamic(() => import("../../../components/MetaDashboard"), { ssr: false });
const LinkedInDashboard = dynamic(() => import("../../../components/LinkedInDashboard"), { ssr: false });
import { getApiUrl, apiFetch } from "../../../lib/auth";
import { getActiveWorkspace, withWorkspace } from "../../../lib/workspace";
import { demoData } from "../../../lib/demoData";
import { KpiCard, SectionCard, BarList, Sparkline, PALETTE } from "../../../components/workspace/primitives";
import FloAssistant from "../../../components/workspace/FloAssistant";
import OnboardingChecklist from "../../../components/workspace/OnboardingChecklist";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "audience", label: "Audience" },
  { id: "acquisition", label: "Acquisition" },
  { id: "behavior", label: "Behavior" },
  { id: "conversions", label: "Conversions" },
];

const SOURCES = [
  { id: "google", label: "Google Analytics" },
  { id: "meta", label: "Meta" },
  { id: "linkedin", label: "LinkedIn" },
];

const DEVICE_COLORS = ["var(--indigo)", "var(--violet)", "var(--teal)", "var(--amber)"];

function fmtNum(v: string | number | undefined) {
  const n = typeof v === "string" ? parseFloat(v) : v ?? 0;
  if (isNaN(n)) return String(v ?? "0");
  return Math.round(n).toLocaleString();
}
function fmtMoney(v: string | number | undefined) {
  const n = typeof v === "string" ? parseFloat(v) : v ?? 0;
  return "$" + (isNaN(n) ? 0 : n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}
function delta(series: number[]): number | undefined {
  if (!series || series.length < 14) return undefined;
  const n = 7;
  const last = series.slice(-n).reduce((a, b) => a + b, 0);
  const prev = series.slice(-2 * n, -n).reduce((a, b) => a + b, 0);
  if (!prev) return undefined;
  return Math.round(((last - prev) / prev) * 100);
}

const cardTip = {
  borderRadius: 14,
  border: "1px solid var(--line)",
  boxShadow: "0 10px 30px rgba(20,18,46,.1)",
  fontSize: 12,
};

export default function Dashboard() {
  const [activePlatform, setActivePlatform] = useState("google");
  const [activeSection, setActiveSection] = useState("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [agencyLogo, setAgencyLogo] = useState<string | null>(null);
  const [brand, setBrand] = useState<{ logo_url: string | null; accent_color: string; report_footer: string | null }>(
    { logo_url: null, accent_color: "#5b5bd6", report_footer: null }
  );
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isPlatformLoading, setIsPlatformLoading] = useState(false);
  const [targetPlatform, setTargetPlatform] = useState<string | null>(null);

  const fetchData = async (isManualSync = false, propId = selectedProperty) => {
    if (isManualSync) setSyncing(true);
    try {
      // getApiUrl() is a same-origin path now, so give URL an explicit base.
      const url = new URL(`${getApiUrl()}/api/v1/analytics/dashboard`, window.location.origin);
      if (propId) url.searchParams.append("property_id", propId);
      // "Sync now" bypasses the backend's short-TTL cache for a live pull.
      if (isManualSync) url.searchParams.append("refresh", "true");
      // If viewing a teammate's workspace, scope the request to it.
      const ws = getActiveWorkspace();
      if (ws) url.searchParams.append("workspace", ws);
      // Session rides in the httpOnly cookie — no header needed.
      const res = await apiFetch(url.toString());
      const result = await res.json();
      setData(result.data);
      if (result.data?.active_property_id) setSelectedProperty(result.data.active_property_id);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      if (isManualSync) setTimeout(() => setSyncing(false), 800);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("integration") === "success") {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 5000);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    fetchData();
    const savedLogo = localStorage.getItem("arbflow_agency_logo");
    if (savedLogo) setAgencyLogo(savedLogo);
    // Load this workspace's white-label branding (logo/accent/footer).
    (async () => {
      try {
        const res = await apiFetch(withWorkspace(`${getApiUrl()}/api/v1/workspace/branding`));
        if (res.ok) {
          const b = await res.json();
          setBrand({ logo_url: b.logo_url, accent_color: b.accent_color || "#5b5bd6", report_footer: b.report_footer });
        }
      } catch {}
    })();
  }, []);

  const handlePlatformChange = (platformId: string) => {
    if (platformId === activePlatform) return;
    setTargetPlatform(platformId);
    setIsPlatformLoading(true);
    setTimeout(() => {
      setActivePlatform(platformId);
      setIsPlatformLoading(false);
      setTargetPlatform(null);
    }, 1100);
  };

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPropertyId = e.target.value;
    setSelectedProperty(newPropertyId);
    setLoading(true);
    fetchData(false, newPropertyId);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAgencyLogo(base64String);
        localStorage.setItem("arbflow_agency_logo", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const backendUrl = getApiUrl();
      const res = await apiFetch(`${backendUrl}/api/v1/integrations/google/link`);
      const result = await res.json();
      if (result.url) window.location.href = result.url;
    } catch (err) {
      console.error("Failed to generate Google login link", err);
    }
  };

  const connected = !!(data && data.status === "active");
  const view: any = connected ? data : demoData;
  const isDemo = !connected;

  // When we're not showing live data, explain *why* — so the workspace says
  // "GA4 isn't available for this account, here's sample data" instead of a
  // generic prompt. Reasons come from the backend's status field.
  const status = data?.status;
  const demoNotice =
    status === "reauth_required"
      ? { badge: "Reconnect", text: "Your Google session expired. Reconnect to load your live dashboard.", cta: "Reconnect Google" }
      : status === "no_properties"
      ? { badge: "No GA4", text: "No Google Analytics property is linked to this Google account — showing sample data instead.", cta: "Use another account" }
      : status === "no_access"
      ? { badge: "No GA4", text: data?.message || "Google Analytics isn't available for this account — showing sample data.", cta: "Reconnect Google" }
      : { badge: "Demo data", text: "You're viewing sample data. Connect Google Analytics to load your own numbers.", cta: "Connect Google Analytics" };

  const downloadCSV = () => {
    const rows = view.post_level || [];
    const headers = "Source,Users,Views\n";
    const body = rows.map((r: any) => `${r.source},${r.users},${r.views}`).join("\n");
    const blob = new Blob([headers + body], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ArbFlow_${view.company_name}.csv`;
    a.click();
  };

  const downloadPDF = async () => {
    // Loaded on click so the PDF toolchain never rides the initial bundle.
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF();
    const accent = brand.accent_color || "#5b5bd6";
    const logo = brand.logo_url || agencyLogo;
    let y = 20;
    if (logo) {
      try {
        const p = doc.getImageProperties(logo);
        const w = 40;
        const h = (p.height * w) / p.width;
        doc.addImage(logo, 14, 10, w, h);
        y = 10 + h + 15;
      } catch {}
    }
    doc.setTextColor(accent);
    doc.setFontSize(22);
    doc.text("Agency Performance Report", 14, y);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(12);
    doc.text(`Client Workspace: ${view.company_name}`, 14, y + 8);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, y + 14);
    autoTable(doc, {
      head: [["Source", "Users", "Views"]],
      body: (view.post_level || []).map((r: any) => [r.source, r.users, r.views]),
      startY: y + 25,
      theme: "grid",
      headStyles: { fillColor: accent },
    });
    // White-label footer (falls back to a neutral ArbFlow line when unset).
    const footer = brand.report_footer || "Generated with ArbFlow";
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(footer, 14, doc.internal.pageSize.getHeight() - 10);
    doc.save(`${view.company_name}_Report.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--page)] text-[var(--ink-3)]">
        <div className="w-7 h-7 border-2 border-[var(--line)] border-t-[var(--violet)] rounded-full animate-spin" />
        <span className="ml-3 text-sm">Loading workspace…</span>
      </div>
    );
  }

  const ts = view.time_series || [];
  const usersSeries = ts.map((d: any) => d.users);
  const sessionsSeries = ts.map((d: any) => d.sessions);
  const viewsSeries = ts.map((d: any) => d.views);
  const s = view.summary || {};

  return (
    <div className="w-full text-[var(--ink)] relative pb-24">
      <AnimatePresence>
        {isPlatformLoading && targetPlatform && <PlatformLoader platform={targetPlatform} />}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-[var(--line)] text-[var(--ink)] px-5 py-3 rounded-full shadow-[0_12px_40px_rgba(20,18,46,.14)] flex items-center gap-2.5"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--teal)]" />
            <span className="font-medium text-sm">Google Analytics connected.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- Header ---------------- */}
      <header className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8">
        <div className="flex items-center gap-4">
          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
          <label
            htmlFor="logo-upload"
            className="cursor-pointer flex items-center justify-center w-12 h-12 bg-white border border-[var(--line)] rounded-2xl shadow-sm hover:border-[var(--violet)] transition-all overflow-hidden flex-shrink-0"
          >
            {(brand.logo_url || agencyLogo) ? (
              <img src={brand.logo_url || agencyLogo || ""} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <span className="text-[var(--ink-3)] text-xs font-medium">Logo</span>
            )}
          </label>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em]">{view.company_name} Workspace</h1>
              {isDemo && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(245,166,35,.14)] text-[var(--amber)]">
                  {demoNotice.badge}
                </span>
              )}
            </div>
            {activePlatform === "google" && view.properties?.length > 0 && (
              <select
                value={selectedProperty}
                onChange={handlePropertyChange}
                disabled={isDemo}
                className="mt-1.5 bg-white border border-[var(--line)] text-[var(--ink-2)] text-xs rounded-lg px-2.5 py-1.5 shadow-sm disabled:opacity-60"
              >
                {view.properties.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchData(true)}
            disabled={syncing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--line)] bg-white text-[var(--ink-2)] hover:text-[var(--ink)] hover:shadow-sm transition-all text-xs font-medium disabled:opacity-60"
          >
            <motion.svg
              animate={syncing ? { rotate: 360 } : { rotate: 0 }}
              transition={syncing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
              className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M21 12a9 9 0 11-9-9c2.52 0 4.85.83 6.72 2.24" strokeLinecap="round" />
              <path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
            {syncing ? "Syncing…" : "Sync"}
          </button>
          <button onClick={downloadCSV} className="px-3.5 py-2 rounded-xl border border-[var(--line)] bg-white text-[var(--ink-2)] hover:text-[var(--ink)] hover:shadow-sm transition-all text-xs font-medium">
            Export CSV
          </button>
          <button onClick={downloadPDF} className="px-3.5 py-2 rounded-xl text-white text-xs font-semibold bg-[linear-gradient(100deg,var(--indigo),var(--violet))] hover:opacity-90 transition-opacity">
            Export PDF
          </button>
          <button onClick={handleConnectGoogle} className="px-3.5 py-2 rounded-xl border border-[var(--line)] bg-white text-[var(--ink-2)] hover:text-[var(--ink)] hover:shadow-sm transition-all text-xs font-medium flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            {connected ? "Switch account" : "Connect"}
          </button>
        </div>
      </header>

      {/* ---------------- First-run checklist (own workspace only) ---------------- */}
      <OnboardingChecklist onConnectGoogle={handleConnectGoogle} />

      {/* ---------------- Demo banner ---------------- */}
      {isDemo && activePlatform === "google" && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="rounded-2xl border border-[var(--line)] bg-[linear-gradient(100deg,rgba(91,91,214,.06),rgba(139,92,246,.06))] px-5 py-3.5 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-[var(--ink-2)]">{demoNotice.text}</p>
            <button onClick={handleConnectGoogle} className="text-xs font-semibold text-white px-4 py-2 rounded-lg bg-[linear-gradient(100deg,var(--indigo),var(--violet))] hover:opacity-90 transition-opacity flex-shrink-0">
              {demoNotice.cta} →
            </button>
          </div>
        </div>
      )}

      {/* ---------------- Anomaly alert (live data only) ---------------- */}
      {!isDemo && activePlatform === "google" && data?.anomaly?.is_anomaly && (
        <div className="max-w-7xl mx-auto mb-6">
          <div
            className="rounded-2xl border px-5 py-3.5 flex items-center gap-3"
            style={{
              borderColor: data.anomaly.direction === "dip" ? "rgba(255,107,94,.35)" : "rgba(20,184,166,.35)",
              background: data.anomaly.direction === "dip" ? "rgba(255,107,94,.07)" : "rgba(20,184,166,.07)",
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0"
              style={{ background: data.anomaly.direction === "dip" ? "var(--coral)" : "var(--teal)" }}
            />
            <p className="text-sm text-[var(--ink)]">
              <strong>{data.anomaly.direction === "dip" ? "Worth a look:" : "Nice spike:"}</strong>{" "}
              {data.anomaly.message}
            </p>
          </div>
        </div>
      )}

      {/* ---------------- Source switcher ---------------- */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="inline-flex gap-1 bg-white border border-[var(--line)] p-1 rounded-2xl shadow-sm">
          {SOURCES.map((src) => {
            const active = (targetPlatform || activePlatform) === src.id;
            return (
              <button
                key={src.id}
                onClick={() => handlePlatformChange(src.id)}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-colors ${active ? "text-white" : "text-[var(--ink-2)] hover:text-[var(--ink)]"}`}
              >
                {active && (
                  <motion.div layoutId="active-source" className="absolute inset-0 rounded-xl bg-[linear-gradient(100deg,var(--indigo),var(--violet))]" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                )}
                <span className="relative z-10">{src.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- Section nav (GA only) ---------------- */}
      {activePlatform === "google" && (
        <div className="max-w-7xl mx-auto mb-8 border-b border-[var(--line)]">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeSection === sec.id ? "text-[var(--ink)]" : "text-[var(--ink-3)] hover:text-[var(--ink-2)]"}`}
              >
                {sec.label}
                {activeSection === sec.id && (
                  <motion.div layoutId="active-section" className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-[var(--violet)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Content ---------------- */}
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activePlatform === "meta" && (
            <motion.div key="meta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <MetaDashboard />
            </motion.div>
          )}
          {activePlatform === "linkedin" && (
            <motion.div key="linkedin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <LinkedInDashboard />
            </motion.div>
          )}

          {activePlatform === "google" && (
            <motion.div key={activeSection} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>

              {/* ===== OVERVIEW ===== */}
              {activeSection === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard index={0} label="Active Users" value={fmtNum(s.active_users)} delta={delta(usersSeries)} spark={usersSeries} color="var(--indigo)" />
                    <KpiCard index={1} label="Sessions" value={fmtNum(s.sessions)} delta={delta(sessionsSeries)} spark={sessionsSeries} color="var(--violet)" />
                    <KpiCard index={2} label="Page Views" value={fmtNum(s.page_views)} delta={delta(viewsSeries)} spark={viewsSeries} color="var(--teal)" />
                    <KpiCard index={3} label="Conversions" value={fmtNum(s.conversions)} color="var(--coral)" />
                    <KpiCard index={4} label="Engagement Rate" value={s.engagement_rate || "—"} color="var(--indigo)" />
                    <KpiCard index={5} label="Avg. Duration" value={s.avg_duration || "—"} color="var(--violet)" />
                    <KpiCard index={6} label="Bounce Rate" value={s.bounce_rate || "—"} color="var(--amber)" />
                    <KpiCard index={7} label="Revenue" value={fmtMoney(s.total_revenue)} color="var(--teal)" />
                  </div>

                  <SectionCard title="Traffic trend" subtitle="Users, sessions & views — last 30 days">
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={ts} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--indigo)" stopOpacity="0.25" /><stop offset="1" stopColor="var(--indigo)" stopOpacity="0" /></linearGradient>
                            <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--teal)" stopOpacity="0.18" /><stop offset="1" stopColor="var(--teal)" stopOpacity="0" /></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--ink-3)" }} interval={4} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "var(--ink-3)" }} tickLine={false} axisLine={false} width={40} />
                          <Tooltip contentStyle={cardTip} />
                          <Area type="monotone" dataKey="views" stroke="var(--teal)" strokeWidth={2} fill="url(#gViews)" />
                          <Area type="monotone" dataKey="users" stroke="var(--indigo)" strokeWidth={2.5} fill="url(#gUsers)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </SectionCard>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard title="Top channels" subtitle="Where your users come from">
                      <BarList items={(view.channel_data || []).slice(0, 6).map((c: any) => ({ label: c.channel, value: c.users }))} />
                    </SectionCard>
                    <SectionCard title="Devices" subtitle="Sessions by device category">
                      <div className="flex items-center gap-6">
                        <div className="w-40 h-40 flex-shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={view.device_data} dataKey="users" nameKey="device" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                                {(view.device_data || []).map((_: any, i: number) => <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />)}
                              </Pie>
                              <Tooltip contentStyle={cardTip} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 space-y-2">
                          {(view.device_data || []).map((d: any, i: number) => (
                            <div key={d.device} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2 text-[var(--ink-2)]"><span className="w-2.5 h-2.5 rounded-full" style={{ background: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />{d.device}</span>
                              <span className="font-medium tabular-nums">{fmtNum(d.users)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </SectionCard>
                  </div>

                  <SectionCard title="Flo's take" subtitle="Auto-generated insight">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[rgba(139,92,246,.12)] flex items-center justify-center flex-shrink-0">
                        <span className="text-[var(--violet)] text-lg">✦</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--ink)]">{view.suggestions?.primary_focus}</p>
                        <p className="text-sm text-[var(--ink-2)] mt-1 leading-relaxed">{view.suggestions?.reason}</p>
                        <p className="text-sm text-[var(--ink-2)] mt-2 leading-relaxed"><strong className="text-[var(--ink)]">Next move: </strong>{view.suggestions?.action_item}</p>
                      </div>
                    </div>
                  </SectionCard>
                </div>
              )}

              {/* ===== AUDIENCE ===== */}
              {activeSection === "audience" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard index={0} label="Active Users" value={fmtNum(s.active_users)} color="var(--indigo)" />
                    <KpiCard index={1} label="New Users" value={fmtNum(s.new_users)} color="var(--violet)" />
                    <KpiCard index={2} label="Engaged Sessions" value={fmtNum(s.engaged_sessions)} color="var(--teal)" />
                    <KpiCard index={3} label="Engagement Rate" value={s.engagement_rate || "—"} color="var(--coral)" />
                  </div>

                  <SectionCard title="New vs returning" subtitle="Weekly user mix">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={view.cohort_data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gNew" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--indigo)" stopOpacity="0.3" /><stop offset="1" stopColor="var(--indigo)" stopOpacity="0" /></linearGradient>
                            <linearGradient id="gRet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--violet)" stopOpacity="0.25" /><stop offset="1" stopColor="var(--violet)" stopOpacity="0" /></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                          <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--ink-3)" }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "var(--ink-3)" }} tickLine={false} axisLine={false} width={40} />
                          <Tooltip contentStyle={cardTip} />
                          <Area type="monotone" dataKey="new" stackId="1" stroke="var(--indigo)" strokeWidth={2} fill="url(#gNew)" />
                          <Area type="monotone" dataKey="returning" stackId="1" stroke="var(--violet)" strokeWidth={2} fill="url(#gRet)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </SectionCard>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <SectionCard title="Top countries">
                      <BarList items={(view.geo_data || []).map((g: any) => ({ label: g.country, value: g.users }))} />
                    </SectionCard>
                    <SectionCard title="Browsers">
                      <BarList items={(view.browser_data || []).map((b: any) => ({ label: b.browser, value: b.users }))} />
                    </SectionCard>
                    <SectionCard title="Operating systems">
                      <BarList items={(view.os_data || []).map((o: any) => ({ label: o.os, value: o.users }))} />
                    </SectionCard>
                  </div>
                </div>
              )}

              {/* ===== ACQUISITION ===== */}
              {activeSection === "acquisition" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard index={0} label="Sessions" value={fmtNum(s.sessions)} delta={delta(sessionsSeries)} spark={sessionsSeries} color="var(--indigo)" />
                    <KpiCard index={1} label="New Users" value={fmtNum(s.new_users)} color="var(--violet)" />
                    <KpiCard index={2} label="Channels" value={String((view.channel_data || []).length)} color="var(--teal)" />
                    <KpiCard index={3} label="Top Source" value={(view.post_level?.[0]?.source) || "—"} color="var(--coral)" />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard title="Channels" subtitle="Default channel grouping">
                      <BarList items={(view.channel_data || []).map((c: any) => ({ label: c.channel, value: c.users, hint: `· ${fmtNum(c.sessions)} sess` }))} />
                    </SectionCard>
                    <SectionCard title="Top sources" subtitle="Referrers by users">
                      <BarList items={(view.post_level || []).map((p: any) => ({ label: p.source, value: p.users, hint: `· ${fmtNum(p.views)} views` }))} />
                    </SectionCard>
                  </div>
                </div>
              )}

              {/* ===== BEHAVIOR ===== */}
              {activeSection === "behavior" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard index={0} label="Page Views" value={fmtNum(s.page_views)} delta={delta(viewsSeries)} spark={viewsSeries} color="var(--indigo)" />
                    <KpiCard index={1} label="Views / Session" value={s.views_per_session || "—"} color="var(--violet)" />
                    <KpiCard index={2} label="Total Events" value={fmtNum(s.events)} color="var(--teal)" />
                    <KpiCard index={3} label="Avg. Duration" value={s.avg_duration || "—"} color="var(--coral)" />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard title="Top pages" subtitle="Most viewed paths" className="lg:col-span-1">
                      <div className="overflow-hidden">
                        <table className="w-full text-sm">
                          <thead><tr className="text-[11px] uppercase tracking-wider text-[var(--ink-3)] text-left"><th className="pb-3 font-semibold">Path</th><th className="pb-3 font-semibold text-right">Views</th><th className="pb-3 font-semibold text-right">Avg time</th></tr></thead>
                          <tbody>
                            {(view.pages_data || []).map((p: any, i: number) => (
                              <tr key={i} className="border-t border-[var(--line)]">
                                <td className="py-2.5 font-medium text-[var(--ink)] truncate max-w-[180px]">{p.path}</td>
                                <td className="py-2.5 text-right text-[var(--ink-2)] tabular-nums">{fmtNum(p.views)}</td>
                                <td className="py-2.5 text-right text-[var(--ink-3)] tabular-nums">{p.avg_duration}s</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </SectionCard>
                    <SectionCard title="Top events" subtitle="Event counts (30d)">
                      <BarList items={(view.events_data || []).map((e: any) => ({ label: e.event, value: e.count }))} />
                    </SectionCard>
                  </div>
                </div>
              )}

              {/* ===== CONVERSIONS ===== */}
              {activeSection === "conversions" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard index={0} label="Conversions" value={fmtNum(s.conversions)} color="var(--indigo)" />
                    <KpiCard index={1} label="Transactions" value={fmtNum(s.transactions)} color="var(--violet)" />
                    <KpiCard index={2} label="Revenue" value={fmtMoney(s.total_revenue)} color="var(--teal)" />
                    <KpiCard index={3} label="Engaged Sessions" value={fmtNum(s.engaged_sessions)} color="var(--coral)" />
                  </div>

                  <SectionCard title="Conversion funnel" subtitle="From first view to purchase">
                    <div className="space-y-3">
                      {(view.funnel_data || []).map((f: any, i: number) => {
                        const top = view.funnel_data[0]?.count || 1;
                        const pct = Math.round((f.count / top) * 100);
                        return (
                          <div key={f.step}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="font-medium text-[var(--ink)]">{f.step}</span>
                              <span className="text-[var(--ink-2)] tabular-nums">{fmtNum(f.count)} <span className="text-[var(--ink-3)]">· {pct}%</span></span>
                            </div>
                            <div className="h-7 rounded-lg bg-[var(--line)] overflow-hidden">
                              <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.7, delay: i * 0.08 }} className="h-full rounded-lg" style={{ background: PALETTE[i % PALETTE.length] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SectionCard>

                  <SectionCard title="Top products" subtitle="By revenue">
                    <table className="w-full text-sm">
                      <thead><tr className="text-[11px] uppercase tracking-wider text-[var(--ink-3)] text-left"><th className="pb-3 font-semibold">Product</th><th className="pb-3 font-semibold text-right">Purchases</th><th className="pb-3 font-semibold text-right">Revenue</th></tr></thead>
                      <tbody>
                        {(view.ecommerce_data || []).map((p: any, i: number) => (
                          <tr key={i} className="border-t border-[var(--line)]">
                            <td className="py-3 font-medium text-[var(--ink)]">{p.name}</td>
                            <td className="py-3 text-right text-[var(--ink-2)] tabular-nums">{fmtNum(p.purchases)}</td>
                            <td className="py-3 text-right font-semibold text-[var(--ink)] tabular-nums">{fmtMoney(p.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </SectionCard>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FloAssistant />
    </div>
  );
}
