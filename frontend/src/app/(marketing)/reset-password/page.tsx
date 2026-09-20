"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthAlert, AuthCard, AuthLink, AuthResult } from "../../../components/auth/AuthCard";
import { PasswordInput } from "../../../components/auth/PasswordInput";
import { Button, Field } from "../../../components/ui";
import { getApiUrl } from "../../../lib/auth";
import { friendlyError, messageFromResponse } from "../../../lib/apiError";

const MIN_PASSWORD = 8;

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD;
  const mismatch = confirm.length > 0 && password !== confirm;
  const passwordError = touched.password && tooShort
    ? `At least ${MIN_PASSWORD} characters — ${MIN_PASSWORD - password.length} to go.`
    : undefined;
  const confirmError = touched.confirm && mismatch ? "These don't match." : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (tooShort || mismatch || !password) {
      setTouched({ password: true, confirm: true });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/auth/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) throw new Error(await messageFromResponse(res, "This reset link is invalid or has expired."));
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(friendlyError(err, "Something went wrong. Please try again."));
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthResult
        tone="error"
        title="Invalid reset link"
        description="This link is missing or malformed. Request a fresh one and we'll email it over."
      >
        <AuthLink href="/forgot-password">Request a new link</AuthLink>
      </AuthResult>
    );
  }

  if (done) {
    return (
      <AuthResult
        tone="success"
        title="Password updated"
        description="Taking you to sign in…"
      >
        <AuthLink href="/login">Go now</AuthLink>
      </AuthResult>
    );
  }

  return (
    <AuthCard
      title="Set a new password"
      description="Choose a strong password you don't use anywhere else."
      footer={<>Changed your mind? <AuthLink href="/login">Back to sign in</AuthLink></>}
    >
      {error && <AuthAlert tone="error">{error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="New password"
          htmlFor="password"
          hint={`At least ${MIN_PASSWORD} characters.`}
          error={passwordError}
        >
          <PasswordInput
            id="password"
            required
            autoFocus
            minLength={MIN_PASSWORD}
            autoComplete="new-password"
            invalid={!!passwordError}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            placeholder="••••••••"
          />
        </Field>

        <Field label="Confirm password" htmlFor="confirm" error={confirmError}>
          <PasswordInput
            id="confirm"
            required
            autoComplete="new-password"
            invalid={!!confirmError}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            placeholder="Re-enter your password"
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] bg-[var(--page)]" />}>
      <ResetInner />
    </Suspense>
  );
}
