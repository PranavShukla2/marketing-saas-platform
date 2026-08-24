"use client";

import { useEffect, useState } from "react";
import { Receipt, Sparkles } from "lucide-react";
import { PageHeader } from "../../../components/shell/PageHeader";
import { Badge, Card, CountUp, Skeleton } from "../../../components/ui";
import { DataTable } from "../../../components/workspace/DataTable";
import { EmptyState } from "../../../components/workspace/primitives";
import { apiFetch, getApiUrl } from "../../../lib/auth";
import { withWorkspace } from "../../../lib/workspace";

type Invoice = { date: string; amount: string; status: string };
type Billing = {
  plan: string;
  billing_cycle: string;
  price: string;
  renewal_date: string;
  usage: { current: number; limit: number; percentage: number };
  invoices: Invoice[];
};

export default function BillingPage() {
  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(withWorkspace(`${getApiUrl()}/api/v1/workspace/billing`));
        if (res.ok && !cancelled) setBilling(await res.json());
      } catch (err) {
        console.error("Failed to fetch billing", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const usage = billing?.usage;
  const invoices = billing?.invoices ?? [];
  const pct = usage?.percentage ?? 0;
  // Amber past 80%, red at the cap — a bar that is the same colour at 12% and
  // 99% isn't telling anyone anything.
  const usageTone = pct >= 100 ? "var(--coral)" : pct >= 80 ? "var(--amber)" : "var(--accent)";

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <PageHeader
        title="Billing & usage"
        description="Your plan and this workspace's limits."
        badge={billing ? <Badge tone="accent" dot>{billing.plan}</Badge> : undefined}
      />

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card padding="lg" className="rounded-[var(--radius-xl)] lg:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Current plan</p>
          {loading ? (
            <><Skeleton className="mt-3 h-10 w-40" /><Skeleton className="mt-4 h-4 w-72" /></>
          ) : (
            <>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-[-0.03em] text-[var(--ink)]">{billing?.price}</span>
                <span className="mb-1.5 text-[var(--ink-2)]">/ month</span>
              </div>
              <p className="mt-1 text-lg font-medium text-[var(--ink)]">{billing?.plan}</p>

              <div className="mt-5 flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--accent)]/8 p-4">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
                <p className="text-sm leading-relaxed text-[var(--ink-2)]">
                  Everything is free while ArbFlow is in beta — every dashboard, every
                  integration, every report. There is no card on file and nothing to
                  cancel. We&apos;ll give you plenty of notice before that changes.
                </p>
              </div>
            </>
          )}
        </Card>

        <Card padding="lg" className="rounded-[var(--radius-xl)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Workspace usage</p>
          {loading || !usage ? (
            <><Skeleton className="mt-3 h-9 w-28" /><Skeleton className="mt-6 h-2 w-full" /></>
          ) : (
            <>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
                <CountUp value={usage.current} />
                <span className="ml-1 text-base font-normal text-[var(--ink-3)]">
                  / {usage.limit.toLocaleString()}
                </span>
              </p>
              <p className="mt-1 text-sm text-[var(--ink-2)]">Page views tracked this cycle</p>

              <div
                className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--line)]"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Page views used"
              >
                <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: usageTone }} />
              </div>
              <p className="mt-2 text-right text-xs text-[var(--ink-3)]">{pct}% used</p>
            </>
          )}
        </Card>
      </div>

      <Card padding="lg" className="rounded-[var(--radius-xl)]">
        <h2 className="mb-4 text-base font-semibold text-[var(--ink)]">Billing history</h2>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<Receipt className="size-5" />}
            title="Nothing has been billed"
            description="Invoices will appear here once paid plans arrive. During the beta there's nothing to charge."
          />
        ) : (
          <DataTable
            rows={invoices}
            getKey={(inv, i) => `${inv.date}-${i}`}
            columns={[
              { key: "date", header: "Date", cell: (i) => <span className="font-medium text-[var(--ink)]">{i.date}</span>, sortBy: (i) => i.date },
              { key: "amount", header: "Amount", align: "right", cell: (i) => i.amount },
              { key: "status", header: "Status", align: "right", cell: (i) => <Badge tone="success" size="sm">{i.status}</Badge> },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
