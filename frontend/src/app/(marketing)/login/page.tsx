"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { consumeAuthCode, getApiUrl } from "../../../lib/auth";

// Fetch failures surface as cryptic "Failed to fetch" — translate them.
function friendlyError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    return "Can't reach the server right now. Check your connection and try again.";
  }
  return msg || fallback;
}

// FastAPI validation errors (422) arrive as {detail: [{msg, loc...}]} — pull
// out something readable instead of rendering "[object Object]".
function detailToMessage(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    if (first?.msg) return first.msg.replace(/^Value error,\s*/i, "");
  }
  return fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle the Google OAuth redirect: trade the one-time ?auth_code= for a JWT,
  // or surface an error. The long-lived token is never read from the URL.
  useEffect(() => {
    (async () => {
      if (await consumeAuthCode()) {
        router.push("/dashboard?integration=success");
        return;
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get("registered") === "1") {
        setNotice("Account created — check your email for a verification link, then sign in.");
      }
      const errParam = params.get("error");
      if (errParam) {
        const messages: Record<string, string> = {
          email_unverified:
            "Your Google email isn't verified, so we can't sign you in. Verify it with Google and try again.",
          invalid_state: "Your sign-in session expired. Please try again.",
          no_email: "We couldn't read your Google email. Please try again.",
          google_auth_failed: "Google sign-in failed. Please try again.",
          google_cancelled: "Google sign-in was cancelled. You can try again anytime.",
        };
        setError(messages[errParam] || "Google sign-in failed. Please try again.");
      }
    })();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const backendUrl = getApiUrl();

      const response = await fetch(`${backendUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(detailToMessage(errorData.detail, "Invalid credentials"));
      }

      // The session arrives as an httpOnly Set-Cookie on this response —
      // nothing to store client-side.
      await response.json();
      router.push("/dashboard");

    } catch (err) {
      setError(friendlyError(err, "Sign-in failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const backendUrl = getApiUrl();
      const res = await fetch(`${backendUrl}/api/v1/auth/google/login`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return; // keep the spinner while the browser navigates away
      }
      // No URL back (e.g. Google OAuth not configured server-side).
      setError(data.detail || "Google sign-in is unavailable right now.");
    } catch (err) {
      setError(friendlyError(err, "Could not connect to authentication server."));
    }
    setGoogleLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#fafafa] p-6 font-sans text-gray-900">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
            A
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Welcome back</h1>
          <p className="text-gray-500 text-sm">Sign in to access your analytics workspace.</p>
        </div>

        {notice && !error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-xl border border-green-100 text-center"
          >
            {notice}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Google OAuth Button - Now functional */}
        <button 
          type="button" 
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full flex items-center justify-center space-x-3 py-3.5 mb-6 rounded-2xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {googleLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-gray-600">Connecting...</span>
            </div>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-sm font-medium">Continue with Google</span>
            </>
          )}
        </button>

        <div className="relative flex items-center mb-6">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-wider">Or sign in with email</span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm bg-gray-50/50"
              placeholder="name@company.com"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <Link href="/forgot-password" className="text-xs text-blue-600 font-medium hover:underline">Forgot?</Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm bg-gray-50/50"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full py-3.5 mt-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-black active:scale-[0.98] transition-all duration-200 disabled:opacity-50 shadow-sm">
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Don&apos;t have an account? <Link href="/register" className="text-blue-600 font-medium hover:underline cursor-pointer">Create one</Link>
        </div>
      </motion.div>
    </div>
  );
}