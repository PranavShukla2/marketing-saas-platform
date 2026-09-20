"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthAlert, AuthCard, AuthLink } from "../../../components/auth/AuthCard";
import { GoogleButton } from "../../../components/auth/GoogleButton";
import { PasswordInput } from "../../../components/auth/PasswordInput";
import { Button, Field, Input } from "../../../components/ui";
import { getApiUrl } from "../../../lib/auth";
import { friendlyError, messageFromResponse } from "../../../lib/apiError";

const MIN_PASSWORD = 8;

function RegisterInner() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Shown under the field as you type rather than only after a submit — the
  // old page made you press the button to be told the rule.
  const passwordError =
    touchedPassword && password.length > 0 && password.length < MIN_PASSWORD
      ? `At least ${MIN_PASSWORD} characters — ${MIN_PASSWORD - password.length} to go.`
      : undefined;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Match the server's rule up front so nobody round-trips to find out.
    if (password.length < MIN_PASSWORD) {
      setTouchedPassword(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: company, email, password }),
      });
      if (!res.ok) throw new Error(await messageFromResponse(res, "Couldn't create your account."));

      // Land on login with a success note; preserve a safe ?next= so an invite
      // flow resumes after sign-in.
      const next = new URLSearchParams(window.location.search).get("next");
      const suffix =
        next && next.startsWith("/") && !next.startsWith("//") ? `&next=${encodeURIComponent(next)}` : "";
      router.push(`/login?registered=1${suffix}`);
    } catch (err) {
      setError(friendlyError(err, "Couldn't create your account. Please try again."));
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Get started"
      description="Create your workspace and start tracking analytics."
      footer={<>Already have an account? <AuthLink href="/login">Sign in</AuthLink></>}
    >
      {error && <AuthAlert tone="error">{error}</AuthAlert>}

      <GoogleButton label="Sign up with Google" onError={setError} />

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-[var(--line)]" />
        <span className="text-xs uppercase tracking-wider text-[var(--ink-3)]">Or with email</span>
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <Field label="Company or agency name" htmlFor="company">
          <Input
            id="company"
            required
            autoComplete="organization"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Marketing"
          />
        </Field>

        <Field label="Work email" htmlFor="email">
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

        <Field
          label="Password"
          htmlFor="password"
          hint={`At least ${MIN_PASSWORD} characters.`}
          error={passwordError}
        >
          <PasswordInput
            id="password"
            required
            minLength={MIN_PASSWORD}
            autoComplete="new-password"
            invalid={!!passwordError}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouchedPassword(true)}
            placeholder="••••••••"
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] bg-[var(--page)]" />}>
      <RegisterInner />
    </Suspense>
  );
}
