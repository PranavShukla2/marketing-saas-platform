"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
      // Even on network error we show the same generic confirmation — the
      // backend never reveals whether the address exists, and neither do we.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#fafafa] p-6 font-sans text-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100"
      >
        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">Check your inbox</h1>
            <p className="text-gray-500 text-sm mb-8">
              If an account exists for <span className="font-medium text-gray-700">{email}</span>, a password-reset link is on its way. The link expires in 1 hour.
            </p>
            <Link href="/login" className="text-blue-600 text-sm font-medium hover:underline">Back to sign in</Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">A</div>
              <h1 className="text-3xl font-semibold tracking-tight mb-2">Forgot password?</h1>
              <p className="text-gray-500 text-sm">Enter your email and we&apos;ll send you a reset link.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm bg-gray-50/50"
                  placeholder="name@company.com"
                />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 mt-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-black active:scale-[0.98] transition-all duration-200 disabled:opacity-50 shadow-sm">
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
              Remembered it? <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
