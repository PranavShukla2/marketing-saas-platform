"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "../../../lib/cn";
import { useReducedMotionSafe } from "../../../lib/useReducedMotionSafe";
import { Act } from "./Act";

type Phase = "idle" | "authorising" | "connected";

/** A source's mark: initials on its own colour — no third-party logos. */
function Mark({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] font-mono text-[13px] font-semibold text-white"
      style={{ background: color }}
      aria-hidden="true"
    >
      {text}
    </span>
  );
}

function SourcesVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotionSafe();
  const [played, setPlayed] = useState<Phase>("idle");
  // Under reduced motion the end state is simply shown — derived, not set.
  const phase: Phase = reduce ? "connected" : played;

  // The GA4 card plays the real connect flow once, when it's actually seen.
  useEffect(() => {
    if (!inView || reduce) return;
    const a = setTimeout(() => setPlayed("authorising"), 700);
    const b = setTimeout(() => setPlayed("connected"), 2100);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [inView, reduce]);

  return (
    <div ref={ref} className="space-y-3">
      <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-raised)]">
        {/* On phones the status drops under the name rather than squeezing it. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Mark text="GA4" color="var(--source-ga4)" />
          {/* The min width is what makes the status wrap instead of the name. */}
          <div className="min-w-[11rem] flex-1">
            <p className="font-medium text-[var(--ink)]">Google Analytics</p>
            <p className="text-sm text-[var(--ink-3)]">Read-only · one click with Google</p>
          </div>
          <span
            role="status"
            className={cn(
              "ml-14 inline-flex h-8 shrink-0 items-center gap-2 rounded-full px-3 text-xs font-medium transition-colors duration-[var(--dur-step)] sm:ml-0",
              phase === "connected"
                ? "bg-[var(--source-linkedin)]/12 text-[var(--source-linkedin-ink)]"
                : "border border-[var(--line)] text-[var(--ink)]"
            )}
          >
            {phase === "idle" && "Connect"}
            {phase === "authorising" && (<><Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" /> Authorising with Google</>)}
            {phase === "connected" && (<><span className="size-1.5 rounded-full bg-current" /> Connected</>)}
          </span>
        </div>
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-[var(--dur-merge)] ease-[var(--ease-house)]",
            phase === "connected" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--line)] pt-4 text-sm">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)]">Property</p>
                <p className="mt-1 truncate text-[var(--ink)]">Acme Co — web</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)]">Sync</p>
                <p className="mt-1 text-[var(--ink)]">Every 30 min</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)]">Credentials</p>
                <p className="mt-1 text-[var(--ink)]">Encrypted</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {[
        { mark: "M", color: "var(--source-meta)", name: "Meta Ads", sub: "Facebook & Instagram campaigns" },
        { mark: "in", color: "var(--source-linkedin)", name: "LinkedIn Ads", sub: "Campaign Manager" },
      ].map((s) => (
        <div key={s.name} className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-[var(--line)] p-5">
          <span className="opacity-60"><Mark text={s.mark} color={s.color} /></span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[var(--ink-2)]">{s.name}</p>
            <p className="text-sm text-[var(--ink-3)]">{s.sub}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[var(--page)] px-3 py-1.5 font-mono text-[11px] text-[var(--ink-3)] ring-1 ring-[var(--line)]">
            Coming soon
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ActConnect() {
  return (
    <Act
      index={0}
      title={<>Connect a client <span className="accent-serif">in one click.</span></>}
      body={
        <p>
          Sign in with Google and ArbFlow finds the client&apos;s Analytics properties for you — no exports, no
          spreadsheets, no shared passwords. Meta Ads and LinkedIn are next.
        </p>
      }
      facts={[
        "Read-only access, granted through Google's own consent screen",
        "Every client in its own workspace, synced in the background every 30 minutes",
        "Tokens refresh automatically, so a client never silently disconnects",
      ]}
      visual={<SourcesVisual />}
    />
  );
}
