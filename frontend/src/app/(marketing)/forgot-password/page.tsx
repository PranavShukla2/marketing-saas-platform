"use client";

import { useState } from "react";
import { AuthCard, AuthLink, AuthResult } from "../../../components/auth/AuthCard";
import { Button, Field, Input } from "../../../components/ui";
import { getApiUrl } from "../../../lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${getApiUrl()}/api/v1/auth/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Even on a network error we show the same confirmation. The backend
      // never reveals whether an address has an account, and a page that said
      // "couldn't send" for one address and "sent" for another would leak
      // exactly what the endpoint is careful not to.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <AuthResult
        tone="info"
        title="Check your inbox"
        description={
          <>
            If an account exists for <span className="font-medium text-[var(--ink)]">{email}</span>, a
            password-reset link is on its way. It expires in an hour.
          </>
        }
      >
        <AuthLink href="/login">Back to sign in</AuthLink>
      </AuthResult>
    );
  }

  return (
    <AuthCard
      title="Forgot password?"
      description="Enter your email and we'll send you a reset link."
      footer={<>Remembered it? <AuthLink href="/login">Sign in</AuthLink></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthCard>
  );
}
