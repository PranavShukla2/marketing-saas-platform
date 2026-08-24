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

type Schedule = { recipients: string; frequency: string; enabled: boolean; last_sent_at: string | null };

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  const [sched, setSched] = useState<Schedule>({
    recipients: "", frequency: "weekly", enabled: false, last_sent_at: null,
  });
  const [schedAllowed, setSchedAllowed] = useState(true);
  const [schedSaving, setSchedSaving] = useState(false);

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
    setGenerating(true);
    try {
      const backendUrl = getApiUrl();
      const [dashRes, campRes] = await Promise.all([
        apiFetch(withWorkspace(`${backendUrl}/api/v1/analytics/dashboard`)),
        apiFetch(withWorkspace(`${backendUrl}/api/v1/workspace/campaigns`)),
      ]);
      const d = (await dashRes.json()).data;
      const channels = (await campRes.json()).campaigns || [];

      // Loaded on click so the PDF toolchain never rides the initial bundle.
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      doc.setFont("helvetica");

      doc.setFontSize(22);
      doc.text("Workspace Analytics Report", 20, 30);
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40);
      if (d?.company_name) doc.text(`Workspace: ${d.company_name}`, 20, 47);

      doc.setTextColor(0);
      doc.setFontSize(16);
      doc.text("Executive Summary", 20, 65);
      doc.setFontSize(12);
      doc.text(`Active Users: ${Number(d?.summary?.active_users || 0).toLocaleString()}`, 20, 80);
      doc.text(`Page Views: ${Number(d?.summary?.page_views || 0).toLocaleString()}`, 20, 90);
      doc.text(`Average Session Duration: ${d?.summary?.avg_duration || "0s"}`, 20, 100);
      doc.text(`Bounce Rate: ${d?.summary?.bounce_rate || "0%"}`, 20, 110);

      doc.setLineWidth(0.5);
      doc.line(20, 122, 190, 122);

      doc.setFontSize(16);
      doc.text("Top Traffic Channels", 20, 137);
      doc.setFontSize(12);
      // The channels endpoint returns users/views/ctr — it has never returned
      // `roi`, so the old line printed "ROI: undefined" on every report.
      channels.slice(0, 5).forEach((c: { name: string; users: number; views: number }, i: number) => {
        doc.text(`${i + 1}. ${c.name} — ${Number(c.users).toLocaleString()} users, ${Number(c.views).toLocaleString()} views`, 20, 152 + i * 10);
      });

      const sources = d?.post_level || [];
      if (sources.length > 0) {
        const startY = 152 + Math.min(channels.length, 5) * 10 + 15;
        doc.setFontSize(16);
        doc.text("Traffic Sources", 20, startY);
        doc.setFontSize(12);
        sources.slice(0, 5).forEach((s: { source: string; views: number; users: number }, i: number) => {
          doc.text(`${s.source}: ${s.views} views, ${s.users} users`, 20, startY + 15 + i * 10);
        });
      }

      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("ArbFlow Intelligence Systems", 20, 280);
      doc.save(`ArbFlow_Report_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Report downloaded");
    } catch (err) {
      console.error("Failed to generate report", err);
      toast.error("Couldn't build the report", { description: "We couldn't reach your analytics data." });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <PageHeader
        title="Reports"
        description="Download a snapshot now, or have a branded one emailed to your client on a schedule."
        actions={
          <Button onClick={generatePDF} loading={generating}>
            {!generating && <FileDown />}
            {generating ? "Building…" : "Download report"}
          </Button>
        }
      />

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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
  );
}
