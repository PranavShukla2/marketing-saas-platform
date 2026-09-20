"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPlus } from "lucide-react";
import { AuthCard, AuthResult } from "../../../components/auth/AuthCard";
import { Button } from "../../../components/ui";
import { fetchSession, getApiUrl } from "../../../lib/auth";
import { friendlyError, messageFromResponse } from "../../../lib/apiError";

type State = "checking" | "need_auth" | "accepting" | "success" | "error";

/**
 * Where login/register should send them back to — this same invite link.
 * Read in the click handler rather than during render: `window` doesn't exist
 * on the server, and a component that happens not to reach this branch during
 * SSR today is one refactor away from doing so.
 */
function returnTo(): string {
  return encodeURIComponent(window.location.pathname + window.location.search);
}

function AcceptInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [fetched, setState] = useState<State>("checking");
  const [workspace, setWorkspace] = useState("");
  const [error, setError] = useState("");
  const ran = useRef(false);

  // A link with no token is broken before anything is checked.
  const state: State = token ? fetched : "error";

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;

    (async () => {
      if (!(await fetchSession())) {
        setState("need_auth");
        return;
      }
      setState("accepting");
      try {
        const res = await fetch(`${getApiUrl()}/api/v1/workspace/team/accept`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) throw new Error(await messageFromResponse(res, "This invite couldn't be accepted."));
        const data = await res.json().catch(() => ({}));
        setWorkspace(data.workspace_name || "the workspace");
        setState("success");
      } catch (e) {
        setError(friendlyError(e, "This invite couldn't be accepted."));
        setState("error");
      }
    })();
  }, [token]);

  if (state === "checking" || state === "accepting") {
    return <AuthResult tone="pending" title="Accepting your invite…" description="One moment." />;
  }

  if (state === "need_auth") {
    return (
      <AuthCard
        title="You've been invited"
        description="Sign in — or create an account with the email your invite was sent to — to join the workspace."
        centered
        icon={
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--accent)]/10 text-[var(--accent)]"
          >
            <UserPlus className="size-6" />
          </span>
        }
      >
        <div className="space-y-3">
          <Button size="lg" className="w-full" onClick={() => router.push(`/login?next=${returnTo()}`)}>
            Sign in
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={() => router.push(`/register?next=${returnTo()}`)}>
            Create an account
          </Button>
        </div>
      </AuthCard>
    );
  }

  if (state === "success") {
    return (
      <AuthResult
        tone="success"
        title="You're in"
        description={
          <>
            You now have access to <span className="font-medium text-[var(--ink)]">{workspace}</span>. Switch
            to it any time from the workspace picker in the sidebar.
          </>
        }
      >
        <Button asChild size="lg" className="w-full"><Link href="/dashboard">Go to dashboard</Link></Button>
      </AuthResult>
    );
  }

  return (
    <AuthResult
      tone="error"
      title="Couldn't accept the invite"
      description={error || "This invite link is missing its token."}
    >
      <Button asChild size="lg" className="w-full"><Link href="/dashboard">Go to dashboard</Link></Button>
    </AuthResult>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] bg-[var(--page)]" />}>
      <AcceptInner />
    </Suspense>
  );
}
