"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileDown, History, Mail } from "lucide-react";
import { PageHeader } from "../../../components/shell/PageHeader";
import {
  Badge, Button, Card, Field, Input, Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue, Switch,
} from "../../../components/ui";
import { EmptyState } from "../../../components/workspace/primitives";
import { apiFetch, getApiUrl } from "../../../lib/auth";
import { withWorkspace } from "../../../lib/workspace";
import BrandPreview from "../../../components/brand/BrandPreview";
import { demoData } from "../../../lib/demoData";
import { downloadReportPdf, reportFromWorkspace, type ReportModel } from "../../../lib/report";

type Schedule = { recipients: string; frequency: string; enabled: boolean; last_sent_at: string | null };

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  const [sched, setSched] = useState<Schedule>({
    recipients: "", frequency: "weekly", enabled: false, last_sent_at: null,
  });
  const [schedAllowed, setSchedAllowed] = useState(true);
  const [schedSaving, setSchedSaving] = useState(false);
  // The report this page exports, shown before it's exported. Sample figures
  // (and no download) until GA4 is connected — a sample PDF must never be one
  // click from a client's inbox.
  const [report, setReport] = useState<ReportModel | null>(null);
  const [isSample, setIsSample] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const api = getApiUrl();
        const [dashRes, brandRes] = await Promise.all([
          apiFetch(withWorkspace(`${api}/api/v1/analytics/dashboard`)),
          apiFetch(withWorkspace(`${api}/api/v1/workspace/branding`)),
        ]);
        const d = dashRes.ok ? (await dashRes.json()).data : null;
        const brand = brandRes.ok ? await brandRes.json() : {};
        if (cancelled) return;
        const live = d?.status === "active";
        setIsSample(!live);
        setReport(reportFromWorkspace(live ? d : demoData, brand));
      } catch {
        if (!cancelled) { setIsSample(true); setReport(reportFromWorkspace(demoData, {})); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(withWorkspace(`${getApiUrl()}/api/v1/workspace/report-schedule`));
        if (cancelled) return;
        if (res.status === 403) { setSchedAllowed(false); return; }
        if (res.ok) {
          const s = await res.json();
          setSched({
            recipients: s.recipients || "",
            frequency: s.frequency || "weekly",
            enabled: !!s.enabled,
            last_sent_at: s.last_sent_at,
          });
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const saveSchedule = async () => {
    setSchedSaving(true);
    try {
      const res = await apiFetch(withWorkspace(`${getApiUrl()}/api/v1/workspace/report-schedule`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sched),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Couldn't save the schedule.");
      toast.success(
        sched.enabled ? "Schedule saved" : "Saved — schedule is off",
        sched.enabled
          ? { description: `Your clients get a branded report ${sched.frequency}.` }
          : undefined
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the schedule.");
    } finally {
      setSchedSaving(false);
    }
  };

  const generatePDF = async () => {
    if (!report || isSample) return;
    setGenerating(true);
    try {
      // Fresh date at the moment of export; everything else is what's previewed.
      await downloadReportPdf({ ...report, generated: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) }, `${report.client}_Report.pdf`);
      toast.success("Report downloaded");
    } catch (err) {
      console.error("Failed to generate report", err);
      toast.error("Couldn't build the report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl pb-16">
      <PageHeader
        title="Reports"
        description="Download a snapshot now, or have a branded one emailed to your client on a schedule."
        actions={
          <Button onClick={generatePDF} loading={generating} disabled={!report || isSample} title={isSample ? "Connect Google Analytics to export a report" : undefined}>
            {!generating && <FileDown />}
            {generating ? "Building…" : "Download report"}
          </Button>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0">
      <Card padding="lg" className="mb-5 rounded-[var(--radius-xl)]">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)]/10 text-[var(--accent)]">
              <Mail className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-[var(--ink)]">Automated client reports</h2>
              <p className="mt-0.5 max-w-md text-sm text-[var(--ink-2)]">
                A branded performance report — your logo, colour and footer — emailed to your client automatically.
              </p>
            </div>
          </div>
          {sched.last_sent_at && (
            <Badge tone="neutral">Last sent {new Date(sched.last_sent_at).toLocaleDateString()}</Badge>
          )}
        </div>

        {!schedAllowed ? (
          <p className="text-sm text-[var(--ink-3)]">
            Only the workspace owner or an admin can manage the schedule.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <Field label="Recipients" htmlFor="recipients" hint="Comma-separated." className="flex-1">
                <Input
                  id="recipients"
                  value={sched.recipients}
                  onChange={(e) => setSched((s) => ({ ...s, recipients: e.target.value }))}
                  placeholder="client@company.com, cmo@company.com"
                />
              </Field>
              <Field label="Frequency" htmlFor="frequency" className="sm:w-40">
                <Select value={sched.frequency} onValueChange={(v) => setSched((s) => ({ ...s, frequency: v }))}>
                  <SelectTrigger id="frequency" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
              <label className="flex cursor-pointer select-none items-center gap-3">
                <Switch
                  checked={sched.enabled}
                  onCheckedChange={(v) => setSched((s) => ({ ...s, enabled: v }))}
                  aria-label="Send reports on a schedule"
                />
                <span className="text-sm text-[var(--ink-2)]">
                  {sched.enabled ? "Schedule is on" : "Schedule is off"}
                </span>
              </label>
              <Button variant="outline" onClick={saveSchedule} loading={schedSaving}>
                Save schedule
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card padding="lg" className="rounded-[var(--radius-xl)]">
        <h2 className="mb-4 text-base font-semibold text-[var(--ink)]">Report history</h2>
        {/* There is no history to list: reports are generated in the browser on
            demand and scheduled ones are emailed, neither of which is stored
            anywhere. This used to be four invented rows — "September 2026
            Performance, 2.4 MB" — whose Download button rebuilt today's report
            regardless of which row you clicked. Fabricated records are worse
            than an empty table, because a client could be shown them. */}
        <EmptyState
          icon={<History className="size-5" />}
          title="Nothing stored yet"
          description="Reports are built when you ask for one and emailed when scheduled — we don't keep copies. Once we store sent reports, they'll be listed here to re-download."
        />
      </Card>
      </div>

      {/* What the client receives — the exact report Download builds. */}
      <aside className="lg:sticky lg:top-24">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--ink-2)]">Preview</p>
          {isSample && <Badge tone="warning">Sample figures</Badge>}
        </div>
        {report ? (
          <BrandPreview
            accent={report.accent}
            agencyName={report.agencyName}
            logoUrl={report.logoUrl}
            footer={report.footer}
            client={report.client}
            generated={report.generated}
            kpis={report.kpis}
            rows={report.rows.length ? report.rows : undefined}
          />
        ) : (
          <div className="aspect-[1/1.41] w-full animate-pulse rounded-[var(--radius-md)] bg-[var(--line)] motion-reduce:animate-none" />
        )}
        <p className="mt-2 text-xs leading-relaxed text-[var(--ink-3)]">
          {isSample
            ? "Connect Google Analytics and this fills with the client's live figures."
            : "Your logo, colour and footer come from Settings → Branding."}
        </p>
      </aside>
      </div>
    </div>
  );
}
