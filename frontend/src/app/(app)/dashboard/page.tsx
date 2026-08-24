"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Download, FileText, RefreshCw } from "lucide-react";

import PlatformLoader from "../../../components/PlatformLoader";
import { PageHeader } from "../../../components/shell/PageHeader";
import { useStatusIsland } from "../../../components/shell/StatusIsland";
import {
  Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Tabs, TabsList, TabsTrigger,
} from "../../../components/ui";
import { DashboardSkeleton } from "../../../components/workspace/DashboardSkeleton";
import FloAssistant from "../../../components/workspace/FloAssistant";
import OnboardingChecklist from "../../../components/workspace/OnboardingChecklist";
import { describeConnection } from "../../../components/workspace/connectionState";
import {
  AcquisitionSection, AudienceSection, BehaviorSection, ConversionsSection, OverviewSection,
} from "../../../components/workspace/ga4";
import { GA4_SECTIONS, freshness, type Ga4SectionId, type Ga4View } from "../../../components/workspace/ga4/shared";
import { apiFetch, getApiUrl } from "../../../lib/auth";
import { demoData } from "../../../lib/demoData";
import { getActiveWorkspace, withWorkspace } from "../../../lib/workspace";

// Most sessions never open Meta or LinkedIn, so those tabs load on demand.
const MetaDashboard = dynamic(() => import("../../../components/MetaDashboard"), { ssr: false });
const LinkedInDashboard = dynamic(() => import("../../../components/LinkedInDashboard"), { ssr: false });

const SOURCES = [
  { id: "google", label: "Google Analytics" },
  { id: "meta", label: "Meta" },
  { id: "linkedin", label: "LinkedIn" },
];

type Brand = { logo_url: string | null; accent_color: string; report_footer: string | null };

export default function Dashboard() {
  const [activePlatform, setActivePlatform] = useState("google");
  const [activeSection, setActiveSection] = useState<Ga4SectionId>("overview");
  const [data, setData] = useState<Ga4View | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [agencyLogo, setAgencyLogo] = useState<string | null>(null);
  const [brand, setBrand] = useState<Brand>({ logo_url: null, accent_color: "#5b5bd6", report_footer: null });
  const [isPlatformLoading, setIsPlatformLoading] = useState(false);
  const [targetPlatform, setTargetPlatform] = useState<string | null>(null);
  // setStatus and flash are stable identities from the provider, so fetchData
  // can depend on them without the mount effect re-firing on every status
  // change.
  const { setStatus, flash } = useStatusIsland();

  const fetchData = useCallback(async (isManualSync = false, propId?: string) => {
    if (isManualSync) {
      setSyncing(true);
      setStatus({ kind: "busy", label: "Syncing with Google Analytics…" });
    }
    try {
      // getApiUrl() is a same-origin path now, so give URL an explicit base.
      const url = new URL(`${getApiUrl()}/api/v1/analytics/dashboard`, window.location.origin);
      if (propId) url.searchParams.append("property_id", propId);
      // "Sync now" bypasses the backend's short-TTL cache for a live pull.
      if (isManualSync) url.searchParams.append("refresh", "true");
      const ws = getActiveWorkspace();
      if (ws) url.searchParams.append("workspace", ws);
      // Session rides in the httpOnly cookie — no header needed.
      const res = await apiFetch(url.toString());
      const result = await res.json();
      setData(result.data);
      if (result.data?.active_property_id) setSelectedProperty(result.data.active_property_id);
      if (isManualSync) flash({ kind: "success", label: "Dashboard up to date" });
    } catch (err) {
      console.error("Fetch error:", err);
      if (isManualSync) flash({ kind: "error", label: "Couldn't reach Google Analytics" });
    } finally {
      setLoading(false);
      if (isManualSync) setTimeout(() => setSyncing(false), 600);
    }
  }, [setStatus, flash]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("integration") === "success") {
      flash({ kind: "success", label: "Google Analytics connected" }, 5000);
    }
    window.history.replaceState({}, document.title, window.location.pathname);

    fetchData();
    const savedLogo = localStorage.getItem("arbflow_agency_logo");
    if (savedLogo) setAgencyLogo(savedLogo);

    // This workspace's white-label branding (logo/accent/footer).
    (async () => {
      try {
        const res = await apiFetch(withWorkspace(`${getApiUrl()}/api/v1/workspace/branding`));
        if (res.ok) {
          const b = await res.json();
          setBrand({ logo_url: b.logo_url, accent_color: b.accent_color || "#5b5bd6", report_footer: b.report_footer });
        }
      } catch {}
    })();
  }, [fetchData, flash]);

  const handleConnectGoogle = useCallback(async () => {
    try {
      const res = await apiFetch(`${getApiUrl()}/api/v1/integrations/google/link`);
      const result = await res.json();
      if (result.url) window.location.href = result.url;
    } catch (err) {
      console.error("Failed to generate Google login link", err);
    }
  }, []);

  const connected = data?.status === "active";
  const view: Ga4View = connected ? (data as Ga4View) : (demoData as Ga4View);
  const connection = useMemo(
    () => describeConnection(data?.status, data?.message),
    [data?.status, data?.message]
  );

  // Everything the workspace has to say about its own state goes through the
  // island: the demo/reauth prompt when we're not on live data, the anomaly
  // when we are. Previously these were two stacked banners that pushed the
  // page down as they appeared.
  useEffect(() => {
    if (loading || activePlatform !== "google") return;
    if (!connection.live) {
      setStatus({
        kind: connection.tone === "error" ? "error" : "alert",
        label: connection.summary,
        action: connection.cta ? { label: connection.cta, onClick: handleConnectGoogle } : undefined,
      });
      return;
    }
    const anomaly = data?.anomaly;
    if (anomaly?.is_anomaly && anomaly.message) {
      setStatus({ kind: "alert", label: anomaly.message });
    }
  }, [loading, activePlatform, connection, data?.anomaly, setStatus, handleConnectGoogle]);

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

  const handlePropertyChange = (newPropertyId: string) => {
    setSelectedProperty(newPropertyId);
    setLoading(true);
    fetchData(false, newPropertyId);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setAgencyLogo(base64String);
      localStorage.setItem("arbflow_agency_logo", base64String);
    };
    reader.readAsDataURL(file);
  };

  const downloadCSV = () => {
    const rows = view.post_level ?? [];
    const headers = "Source,Users,Views\n";
    const body = rows.map((r) => `${r.source},${r.users},${r.views}`).join("\n");
    const blob = new Blob([headers + body], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ArbFlow_${view.company_name}.csv`;
    a.click();
    // Without this the blob is pinned in memory for the life of the tab.
    window.URL.revokeObjectURL(url);
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
      body: (view.post_level ?? []).map((r) => [r.source, r.users, r.views]),
      startY: y + 25,
      theme: "grid",
      headStyles: { fillColor: accent },
    });
    // White-label footer (falls back to a neutral ArbFlow line when unset).
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(brand.report_footer || "Generated with ArbFlow", 14, doc.internal.pageSize.getHeight() - 10);
    doc.save(`${view.company_name}_Report.pdf`);
  };

  const updated = freshness(data?.cached_at);
  const properties = view.properties ?? [];

  return (
    <div className="relative w-full pb-24">
      <AnimatePresence>
        {isPlatformLoading && targetPlatform && <PlatformLoader platform={targetPlatform} />}
      </AnimatePresence>

      <PageHeader
        title={`${view.company_name} Workspace`}
        description={updated ?? "Your unified marketing analytics."}
        badge={
          <Badge tone={connection.live ? "success" : "warning"} dot>
            {connection.badge}
          </Badge>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => fetchData(true)} loading={syncing}>
              {!syncing && <RefreshCw />}
              {syncing ? "Syncing…" : "Sync"}
            </Button>
            <Button variant="outline" size="sm" onClick={downloadCSV}>
              <Download />CSV
            </Button>
            <Button size="sm" onClick={downloadPDF}>
              <FileText />PDF
            </Button>
          </>
        }
      />

      {/* Branding + property picker sit under the header rather than inside it:
          they belong to the data being shown, not to the page's identity. */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
        <label
          htmlFor="logo-upload"
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-rest)] transition-colors hover:border-[var(--accent)]"
          title="Upload your agency logo"
        >
          {brand.logo_url || agencyLogo ? (
            // eslint-disable-next-line @next/next/no-img-element -- a base64 data URL, not an optimisable asset
            <img src={brand.logo_url || agencyLogo || ""} alt="Agency logo" className="size-full object-contain p-1" />
          ) : (
            <span className="text-xs font-medium text-[var(--ink-3)]">Logo</span>
          )}
        </label>

        {activePlatform === "google" && properties.length > 0 && (
          <Select value={selectedProperty} onValueChange={handlePropertyChange} disabled={!connection.live}>
            <SelectTrigger size="sm" aria-label="Google Analytics property" className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {!connection.live && (
          <Button variant="ghost" size="sm" onClick={handleConnectGoogle}>
            {connection.cta}
          </Button>
        )}
      </div>

      <OnboardingChecklist onConnectGoogle={handleConnectGoogle} />

      <div className="mb-6">
        <Tabs group="source" value={targetPlatform ?? activePlatform} onValueChange={handlePlatformChange}>
          <TabsList>
            {SOURCES.map((src) => (
              <TabsTrigger key={src.id} value={src.id}>{src.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {activePlatform === "google" && (
        <div className="mb-7">
          <Tabs
            group="section"
            value={activeSection}
            onValueChange={(v) => setActiveSection(v as Ga4SectionId)}
          >
            <TabsList variant="underline" className="overflow-x-auto">
              {GA4_SECTIONS.map((sec) => (
                <TabsTrigger key={sec.id} variant="underline" value={sec.id}>{sec.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

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
          <motion.div
            key={loading ? "loading" : activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            {loading ? (
              <DashboardSkeleton />
            ) : (
              <>
                {activeSection === "overview" && <OverviewSection view={view} />}
                {activeSection === "audience" && <AudienceSection view={view} />}
                {activeSection === "acquisition" && <AcquisitionSection view={view} />}
                {activeSection === "behavior" && <BehaviorSection view={view} />}
                {activeSection === "conversions" && <ConversionsSection view={view} />}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <FloAssistant />
    </div>
  );
}
