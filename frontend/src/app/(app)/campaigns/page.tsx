"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Radio } from "lucide-react";
import { PageHeader } from "../../../components/shell/PageHeader";
import {
  Badge, Button, Card, Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "../../../components/ui";
import { DataTable } from "../../../components/workspace/DataTable";
import { EmptyState } from "../../../components/workspace/primitives";
import { apiFetch, getApiUrl } from "../../../lib/auth";
import { DURATION, EASE_OUT } from "../../../lib/motion";
import { useReducedMotionSafe } from "../../../lib/useReducedMotionSafe";
import { withWorkspace } from "../../../lib/workspace";

type Channel = {
  id: number; name: string; status: string;
  views: number; users: number; ctr: string;
};

export default function CampaignsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [gaStatus, setGaStatus] = useState("pending_integration");
  const [loading, setLoading] = useState(true);
  const reduce = useReducedMotionSafe();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(withWorkspace(`${getApiUrl()}/api/v1/workspace/campaigns`));
        if (res.ok && !cancelled) {
          const data = await res.json();
          setChannels(data.campaigns || []);
          setGaStatus(data.ga_status || "pending_integration");
        }
      } catch (err) {
        console.error("Failed to fetch channels", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalViews = channels.reduce((a, c) => a + c.views, 0);
  const totalUsers = channels.reduce((a, c) => a + c.users, 0);

  return (
    <div className="mx-auto max-w-6xl pb-16">
      <PageHeader
        title="Traffic channels"
        description="Where your visitors come from, read straight from Google Analytics."
        badge={!loading && channels.length > 0 ? <Badge tone="success" dot>Live</Badge> : undefined}
        actions={<HowItWorks />}
      />

      {loading ? (
        <Card padding="lg" className="rounded-[var(--radius-xl)]">
          <div className="h-40 animate-pulse rounded-[var(--radius-md)] bg-[var(--line)]" />
        </Card>
      ) : channels.length === 0 ? (
        <Card padding="lg" className="rounded-[var(--radius-xl)]">
          <EmptyState
            icon={<Radio className="size-5" />}
            title={gaStatus === "pending_integration" ? "No channels yet" : "Not enough traffic yet"}
            description={
              gaStatus === "pending_integration"
                ? "Connect Google Analytics and every traffic source it sees — search, social, email, referrals — is listed here automatically."
                : "Your GA4 property hasn't recorded enough traffic in the last 30 days. Channels appear here as visitors arrive."
            }
            action={
              gaStatus === "pending_integration" ? (
                <Button asChild><a href="/integrations">Connect Google Analytics</a></Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              { label: "Channels", value: channels.length.toLocaleString() },
              { label: "Total users", value: totalUsers.toLocaleString() },
              { label: "Total views", value: totalViews.toLocaleString() },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduce ? { duration: 0 } : { duration: DURATION.base, delay: i * 0.05, ease: EASE_OUT }}
              >
                <Card padding="sm" className="p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">{s.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.02em] tabular-nums text-[var(--ink)]">{s.value}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card padding="lg" className="rounded-[var(--radius-xl)]">
            <DataTable
              rows={channels}
              getKey={(c) => String(c.id)}
              defaultSort={{ key: "users", direction: "desc" }}
              columns={[
                {
                  key: "name",
                  header: "Channel",
                  sortBy: (c) => c.name,
                  cell: (c) => <span className="font-medium text-[var(--ink)]">{c.name}</span>,
                },
                {
                  key: "share",
                  header: "Share of users",
                  cell: (c) => (
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[var(--line)]">
                        <div
                          className="h-full rounded-full bg-[var(--accent)]"
                          style={{ width: `${totalUsers ? (c.users / totalUsers) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="tabular-nums text-xs text-[var(--ink-3)]">
                        {totalUsers ? Math.round((c.users / totalUsers) * 100) : 0}%
                      </span>
                    </div>
                  ),
                  sortBy: (c) => c.users,
                },
                { key: "users", header: "Users", align: "right", cell: (c) => c.users.toLocaleString(), sortBy: (c) => c.users },
                { key: "views", header: "Views", align: "right", cell: (c) => c.views.toLocaleString(), sortBy: (c) => c.views },
                { key: "ctr", header: "Views / user", align: "right", cell: (c) => c.ctr, sortBy: (c) => parseFloat(c.ctr) || 0 },
                {
                  key: "status",
                  header: "Volume",
                  align: "right",
                  cell: (c) =>
                    c.status === "Active"
                      ? <Badge tone="success" size="sm">Active</Badge>
                      : <Badge tone="neutral" size="sm">Low traffic</Badge>,
                  sortBy: (c) => c.status,
                },
              ]}
            />
          </Card>
        </>
      )}
    </div>
  );
}

function HowItWorks() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><HelpCircle />How it works</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Where these numbers come from</DialogTitle>
          <DialogDescription>
            This page is a read-only view of your Google Analytics traffic sources
            over the last 30 days. Nothing here is something ArbFlow runs, so
            there is nothing to start, pause or delete.
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-3 text-sm">
          {[
            ["Channel", "The source GA4 attributes the visit to — Google, Direct, a referrer, a campaign."],
            ["Users", "Unique visitors who arrived through that source."],
            ["Views", "Page views those visitors generated."],
            ["Views / user", "How many pages the average visitor from that source reads. A high number means the traffic is engaged; a low one means people arrive and leave."],
            ["Volume", "A rough marker: sources with more than 50 views in the period are marked Active."],
          ].map(([term, def]) => (
            <div key={term}>
              <dt className="font-semibold text-[var(--ink)]">{term}</dt>
              <dd className="text-[var(--ink-2)]">{def}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
