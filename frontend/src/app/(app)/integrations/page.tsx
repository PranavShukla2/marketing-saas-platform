"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Check, Link2, ShieldCheck } from "lucide-react";
import { PageHeader } from "../../../components/shell/PageHeader";
import { Badge, Button, Card, Skeleton } from "../../../components/ui";
import { apiFetch, getApiUrl } from "../../../lib/auth";
import { DURATION, EASE_OUT } from "../../../lib/motion";
import { useReducedMotionSafe } from "../../../lib/useReducedMotionSafe";

type Row = { provider: string; connected: boolean; property_id: string | null; connected_at: string | null };

/**
 * The provider directory.
 *
 * `available: false` is deliberate and honest: the Meta and LinkedIn OAuth
 * flows still store mock tokens server-side, so offering a Connect button
 * would start something that cannot finish. Saying "coming soon" is better
 * than a button that appears to work.
 */
const PROVIDERS = [
  {
    id: "google_analytics",
    name: "Google Analytics 4",
    description: "Live traffic, audience, acquisition and conversion data from your GA4 property.",
    accent: "#E8710A",
    available: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-6" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2V7h2v10z" />
      </svg>
    ),
  },
  {
    id: "meta_ads",
    name: "Meta",
    description: "Facebook and Instagram reach, engagement and ad performance in one view.",
    accent: "#1877F2",
    available: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-6" aria-hidden="true">
        <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
      </svg>
    ),
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "B2B impressions, engagement rates and professional audience demographics.",
    accent: "#0A66C2",
    available: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-6" aria-hidden="true">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  },
];

export default function IntegrationsPage() {
  const [rows, setRows] = useState<Record<string, Row> | null>(null);
  const [failed, setFailed] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const reduce = useReducedMotionSafe();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`${getApiUrl()}/api/v1/integrations/`);
        if (!res.ok) throw new Error(String(res.status));
        const body = await res.json();
        if (!cancelled) {
          setRows(Object.fromEntries((body.integrations as Row[]).map((r) => [r.provider, r])));
        }
      } catch {
        // A failed lookup must not read as "nothing is connected" — that would
        // invite a user to redo an OAuth flow they never lost. Say we don't
        // know instead.
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const connect = useCallback(async (provider: string) => {
    if (provider !== "google_analytics") return;
    setConnecting(provider);
    try {
      const res = await apiFetch(`${getApiUrl()}/api/v1/integrations/google/link`);
      const body = await res.json();
      if (body.url) { window.location.href = body.url; return; }
    } catch {}
    setConnecting(null);
  }, []);

  const connectedCount = rows ? Object.values(rows).filter((r) => r.connected).length : 0;

  return (
    <div className="pb-16">
      <PageHeader
        title="Integrations"
        description="Connect a data source and its numbers flow into every dashboard and report."
        badge={
          rows && !failed ? (
            <Badge tone={connectedCount > 0 ? "success" : "neutral"} dot>
              {connectedCount} connected
            </Badge>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {PROVIDERS.map((p, i) => {
          const row = rows?.[p.id];
          const connected = !!row?.connected;
          return (
            <motion.div
              key={p.id}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? { duration: 0 } : { duration: DURATION.base, delay: i * 0.06, ease: EASE_OUT }}
            >
              <Card padding="lg" className="flex h-full flex-col rounded-[var(--radius-xl)]">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="flex size-12 items-center justify-center rounded-[var(--radius-md)]"
                    // A tint of the provider's own colour, so it reads as their
                    // brand in either theme without a hardcoded pale background.
                    style={{ background: `color-mix(in srgb, ${p.accent} 14%, transparent)`, color: p.accent }}
                  >
                    {p.icon}
                  </span>
                  {failed ? (
                    <Badge tone="warning"><AlertTriangle className="size-3" />Unknown</Badge>
                  ) : !rows ? (
                    <Skeleton className="h-6 w-20 rounded-full" />
                  ) : connected ? (
                    <Badge tone="success"><Check className="size-3" />Connected</Badge>
                  ) : p.available ? (
                    <Badge tone="neutral">Not connected</Badge>
                  ) : (
                    <Badge tone="info">Coming soon</Badge>
                  )}
                </div>

                <h2 className="mt-5 text-lg font-semibold text-[var(--ink)]">{p.name}</h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[var(--ink-2)]">{p.description}</p>

                {connected && row?.property_id && (
                  <p className="mt-3 truncate font-mono text-xs text-[var(--ink-3)]" title={row.property_id}>
                    {row.property_id}
                  </p>
                )}

                <div className="mt-6">
                  {!rows && !failed ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Button
                      // An unavailable provider gets a neutral button, not a
                      // faded brand gradient — a 50%-opacity primary still
                      // reads as the loudest thing on the card.
                      variant={connected || !p.available ? "outline" : "primary"}
                      className="w-full"
                      disabled={!p.available}
                      loading={connecting === p.id}
                      onClick={() => connect(p.id)}
                    >
                      {p.available && connecting !== p.id && <Link2 />}
                      {!p.available ? "Not available yet" : connected ? "Reconnect" : `Connect ${p.name}`}
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-8 flex items-center justify-center gap-2 text-xs text-[var(--ink-3)]">
        <ShieldCheck className="size-4" />
        Credentials are encrypted at rest and never leave our servers.
      </p>
    </div>
  );
}
