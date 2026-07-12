"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getApiUrl, apiFetch } from "../../lib/auth";
import { getActiveWorkspace } from "../../lib/workspace";

type Steps = { connect_ga: boolean; invite_team: boolean; set_branding: boolean; schedule_report: boolean };

const DISMISS_KEY = "arbflow_onboarding_dismissed";

/** First-run checklist. Steps come from the backend's real state (so they
 * check themselves off), it only shows on your OWN workspace, disappears
 * forever once everything's done, and can be dismissed early. */
export default function OnboardingChecklist({ onConnectGoogle }: { onConnectGoogle: () => void }) {
  const [steps, setSteps] = useState<Steps | null>(null);
  const [complete, setComplete] = useState(true); // assume done until told otherwise (no flash)
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Onboarding is about YOUR account — hide it while viewing a teammate's workspace.
    if (getActiveWorkspace()) return;
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
    (async () => {
      try {
        const res = await apiFetch(`${getApiUrl()}/api/v1/workspace/onboarding`);
        if (res.ok) {
          const data = await res.json();
          setSteps(data.steps);
          setComplete(!!data.complete);
        }
      } catch {}
    })();
  }, []);

  if (!steps || complete || dismissed) return null;

  const items = [
    {
      key: "connect_ga", done: steps.connect_ga,
      title: "Connect Google Analytics",
      desc: "Swap the sample data for your real numbers.",
      cta: <button onClick={onConnectGoogle} className="text-xs font-semibold text-[var(--indigo)] hover:underline">Connect →</button>,
    },
    {
      key: "invite_team", done: steps.invite_team,
      title: "Invite your team",
      desc: "Teammates get their own login and see this workspace.",
      cta: <Link href="/team" className="text-xs font-semibold text-[var(--indigo)] hover:underline">Invite →</Link>,
    },
    {
      key: "set_branding", done: steps.set_branding,
      title: "Add your branding",
      desc: "Your logo, colour and footer on dashboards and reports.",
      cta: <Link href="/settings" className="text-xs font-semibold text-[var(--indigo)] hover:underline">Set up →</Link>,
    },
    {
      key: "schedule_report", done: steps.schedule_report,
      title: "Schedule a client report",
      desc: "A branded summary emailed to your client on autopilot.",
      cta: <Link href="/reports" className="text-xs font-semibold text-[var(--indigo)] hover:underline">Schedule →</Link>,
    },
  ];
  const doneCount = items.filter((i) => i.done).length;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="max-w-7xl mx-auto mb-6"
      >
        <div className="rounded-2xl border border-[var(--line)] bg-white shadow-[0_2px_20px_rgba(20,18,46,.04)] p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--ink)]">Get set up — {doneCount} of {items.length} done</h3>
              <p className="text-xs text-[var(--ink-3)] mt-0.5">A couple of minutes and your workspace runs itself.</p>
            </div>
            <button onClick={dismiss} aria-label="Dismiss checklist" className="text-[var(--ink-3)] hover:text-[var(--ink)] text-xs font-medium flex-shrink-0">
              Dismiss ✕
            </button>
          </div>

          {/* progress */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-[linear-gradient(100deg,var(--indigo),var(--violet))] transition-all duration-500"
              style={{ width: `${(doneCount / items.length) * 100}%` }}
            />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {items.map((item) => (
              <div key={item.key} className={`rounded-xl border p-3.5 ${item.done ? "border-teal-100 bg-teal-50/40" : "border-[var(--line)] bg-[var(--page)]/40"}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${item.done ? "bg-[var(--teal)] text-white" : "border border-gray-300 text-transparent"}`}>✓</span>
                  <p className={`text-xs font-semibold ${item.done ? "text-[var(--ink-2)] line-through decoration-[var(--teal)]/40" : "text-[var(--ink)]"}`}>{item.title}</p>
                </div>
                <p className="text-[11px] text-[var(--ink-3)] leading-relaxed mb-1.5 pl-7">{item.desc}</p>
                {!item.done && <div className="pl-7">{item.cta}</div>}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
