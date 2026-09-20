"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthResult } from "../../../components/auth/AuthCard";
import { Button } from "../../../components/ui";
import { getApiUrl } from "../../../lib/auth";

type State = "verifying" | "success" | "error";

function VerifyInner() {
  const token = useSearchParams().get("token");
  const [fetched, setState] = useState<State>("verifying");
  // No token means the link is broken; don't spend a render pretending to check.
  const state: State = token ? fetched : "error";
  const ran = useRef(false); // guard React's double-invoke; the token is single-use

  useEffect(() => {
    // A missing token is knowable at render (see `state` below), so there is
    // nothing for the effect to do — and nothing to verify.
    if (!token || ran.current) return;
    ran.current = true;

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

  if (state === "verifying") {
    return <AuthResult tone="pending" title="Verifying your email…" description="One moment." />;
  }

  if (state === "success") {
    return (
      <AuthResult
        tone="success"
        title="Email verified"
        description="You're all set — sign in to your workspace."
      >
        <Button asChild size="lg" className="w-full"><Link href="/login">Go to sign in</Link></Button>
      </AuthResult>
    );
  }

  return (
    <AuthResult
      tone="error"
      title="Link invalid or expired"
      description="This verification link is no longer valid. Signing in will offer you a fresh one."
    >
      <Button asChild size="lg" className="w-full"><Link href="/login">Back to sign in</Link></Button>
    </AuthResult>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] bg-[var(--page)]" />}>
      <VerifyInner />
    </Suspense>
  );
}
