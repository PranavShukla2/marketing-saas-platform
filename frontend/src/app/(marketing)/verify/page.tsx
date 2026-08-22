"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { getApiUrl } from "../../../lib/auth";

type State = "verifying" | "success" | "error";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("verifying");
  const ran = useRef(false); // guard React double-invoke; token is single-use

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setState("error");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/v1/auth/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        setState(res.ok ? "success" : "error");
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[var(--page)] p-6 font-sans text-[var(--ink)]">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-[var(--surface)] p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[var(--line)] text-center"
      >
        {state === "verifying" && (
          <>
            <div className="w-10 h-10 border-2 border-[var(--line)] border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-semibold tracking-tight mb-2">Verifying your email…</h1>
            <p className="text-[var(--ink-2)] text-sm">One moment.</p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">Email verified</h1>
            <p className="text-[var(--ink-2)] text-sm mb-8">You&apos;re all set — sign in to your workspace.</p>
            <Link href="/login">
              <button className="w-full py-3.5 rounded-xl bg-[var(--ink)] text-[var(--page)] text-sm font-medium hover:bg-[var(--ink)] active:scale-[0.98] transition-all">
                Go to sign in
              </button>
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">Link invalid or expired</h1>
            <p className="text-[var(--ink-2)] text-sm mb-8">This verification link is no longer valid. You can request a fresh one from the sign-in page.</p>
            <Link href="/login">
              <button className="w-full py-3.5 rounded-xl bg-[var(--ink)] text-[var(--page)] text-sm font-medium hover:bg-[var(--ink)] active:scale-[0.98] transition-all">
                Back to sign in
              </button>
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] bg-[var(--page)]" />}>
      <VerifyInner />
    </Suspense>
  );
}
