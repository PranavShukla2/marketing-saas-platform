"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { getApiUrl, fetchSession } from "../../../lib/auth";

type State = "checking" | "need_auth" | "accepting" | "success" | "error";

function AcceptInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [state, setState] = useState<State>("checking");
  const [workspace, setWorkspace] = useState<string>("");
  const [error, setError] = useState("");
  const ran = useRef(false);

  // Where login/register should send the user back to (this same invite link).
  const returnTo = typeof window !== "undefined"
    ? encodeURIComponent(window.location.pathname + window.location.search)
    : "";

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) { setState("error"); setError("This invite link is missing its token."); return; }

    (async () => {
      const authed = await fetchSession();
      if (!authed) { setState("need_auth"); return; }
      setState("accepting");
      try {
        const res = await fetch(`${getApiUrl()}/api/v1/workspace/team/accept`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || "This invite couldn't be accepted.");
        setWorkspace(data.workspace_name || "the workspace");
        setState("success");
      } catch (e) {
        setError(e instanceof Error ? e.message : "This invite couldn't be accepted.");
        setState("error");
      }
    })();
  }, [token]);

  const card = "w-full max-w-md bg-[var(--surface)] p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[var(--line)] text-center";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[var(--page)] p-6 font-sans text-[var(--ink)]">
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} className={card}>
        {(state === "checking" || state === "accepting") && (
          <>
            <div className="w-10 h-10 border-2 border-[var(--line)] border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-semibold tracking-tight mb-2">Accepting your invite…</h1>
            <p className="text-[var(--ink-2)] text-sm">One moment.</p>
          </>
        )}

        {state === "need_auth" && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">You&apos;ve been invited</h1>
            <p className="text-[var(--ink-2)] text-sm mb-8">Sign in — or create an account with the email your invite was sent to — to join the workspace.</p>
            <div className="space-y-3">
              <button onClick={() => router.push(`/login?next=${returnTo}`)} className="w-full py-3.5 rounded-xl bg-[var(--ink)] text-[var(--page)] text-sm font-medium hover:bg-[var(--ink)] active:scale-[0.98] transition-all">Sign in</button>
              <button onClick={() => router.push(`/register?next=${returnTo}`)} className="w-full py-3.5 rounded-xl border border-[var(--line)] text-[var(--ink)] text-sm font-medium hover:bg-[var(--page)] transition-all">Create an account</button>
            </div>
          </>
        )}

        {state === "success" && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">You&apos;re in</h1>
            <p className="text-[var(--ink-2)] text-sm mb-8">You now have access to <span className="font-medium text-[var(--ink-2)]">{workspace}</span>. Switch to it any time from the workspace picker in the sidebar.</p>
            <Link href="/dashboard"><button className="w-full py-3.5 rounded-xl bg-[var(--ink)] text-[var(--page)] text-sm font-medium hover:bg-[var(--ink)] active:scale-[0.98] transition-all">Go to dashboard</button></Link>
          </>
        )}

        {state === "error" && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">Couldn&apos;t accept the invite</h1>
            <p className="text-[var(--ink-2)] text-sm mb-8">{error}</p>
            <Link href="/dashboard"><button className="w-full py-3.5 rounded-xl bg-[var(--ink)] text-[var(--page)] text-sm font-medium hover:bg-[var(--ink)] active:scale-[0.98] transition-all">Go to dashboard</button></Link>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] bg-[var(--page)]" />}>
      <AcceptInner />
    </Suspense>
  );
}
