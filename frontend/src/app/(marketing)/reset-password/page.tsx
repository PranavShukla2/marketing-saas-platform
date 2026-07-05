"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { getApiUrl } from "../../../lib/auth";

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/auth/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "This reset link is invalid or has expired.");
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#fafafa] p-6 font-sans text-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100"
      >
        {children}
      </motion.div>
    </div>
  );

  if (!token) {
    return shell(
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Invalid reset link</h1>
        <p className="text-gray-500 text-sm mb-8">This link is missing or malformed. Request a new one from the sign-in page.</p>
        <Link href="/forgot-password" className="text-blue-600 text-sm font-medium hover:underline">Request a new link</Link>
      </div>
    );
  }

  if (done) {
    return shell(
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Password updated</h1>
        <p className="text-gray-500 text-sm">Taking you to sign in…</p>
      </div>
    );
  }

  return shell(
    <>
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">A</div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Set a new password</h1>
        <p className="text-gray-500 text-sm">Choose a strong password you don&apos;t use elsewhere.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm bg-gray-50/50"
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
          <input
            type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm bg-gray-50/50"
            placeholder="Re-enter your password"
          />
        </div>
        <button type="submit" disabled={loading} className="w-full py-3.5 mt-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-black active:scale-[0.98] transition-all duration-200 disabled:opacity-50 shadow-sm">
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] bg-[#fafafa]" />}>
      <ResetInner />
    </Suspense>
  );
}
