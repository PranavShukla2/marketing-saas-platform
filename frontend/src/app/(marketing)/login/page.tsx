"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthAlert, AuthCard, AuthLink } from "../../../components/auth/AuthCard";
import { GoogleButton } from "../../../components/auth/GoogleButton";
import { PasswordInput } from "../../../components/auth/PasswordInput";
import { Button, Field, Input } from "../../../components/ui";
import { consumeAuthCode, getApiUrl } from "../../../lib/auth";
import { friendlyError, messageFromResponse } from "../../../lib/apiError";

/** Reject anything non-relative, so ?next= can't become an open redirect. */
function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
}

const GOOGLE_ERRORS: Record<string, string> = {
  email_unverified:
    "Your Google email isn't verified, so we can't sign you in. Verify it with Google and try again.",
  invalid_state: "Your sign-in session expired. Please try again.",
  no_email: "We couldn't read your Google email. Please try again.",
  google_auth_failed: "Google sign-in failed. Please try again.",
  google_cancelled: "Google sign-in was cancelled. You can try again anytime.",
};

function LoginInner() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle the Google OAuth redirect: trade the one-time ?auth_code= for a
  // session. The long-lived token is never read from the URL.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (await consumeAuthCode()) {
        router.push("/dashboard?integration=success");
        return;
      }
      if (cancelled) return;
      const params = new URLSearchParams(window.location.search);
      if (params.get("registered") === "1") {
        setNotice("Account created — check your email for a verification link, then sign in.");
      }
      const errParam = params.get("error");
      if (errParam) setError(GOOGLE_ERRORS[errParam] ?? "Google sign-in failed. Please try again.");
    })();
    return () => { cancelled = true; };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(await messageFromResponse(res, "Invalid email or password."));
      // The session arrives as an httpOnly Set-Cookie — nothing to store.
      await res.json();
      router.push(safeNext(new URLSearchParams(window.location.search).get("next")));
    } catch (err) {
      setError(friendlyError(err, "Sign-in failed. Please try again."));
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your analytics workspace."
      footer={<>Don&apos;t have an account? <AuthLink href="/register">Create one</AuthLink></>}
    >
      {notice && !error && <AuthAlert tone="success">{notice}</AuthAlert>}
      {error && <AuthAlert tone="error">{error}</AuthAlert>}

      <GoogleButton onError={setError} />

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-[var(--line)]" />
        <span className="text-xs uppercase tracking-wider text-[var(--ink-3)]">Or with email</span>
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
          />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="select-none text-sm font-medium text-[var(--ink-2)]">
              Password
            </label>
            <AuthLink href="/forgot-password">
              <span className="text-xs">Forgot?</span>
            </AuthLink>
          </div>
          <PasswordInput
            id="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] bg-[var(--page)]" />}>
      <LoginInner />
    </Suspense>
  );
}
