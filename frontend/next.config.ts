import { withSentryConfig } from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";

// Backend the browser is allowed to talk to (connect-src). Kept in sync with
// lib/auth.getApiUrl()'s production fallback.
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "https://arbflow-backend.onrender.com";

// A pragmatic CSP for a statically-generated Next app: nonces don't work with
// static output, and Next hydration + Framer inject inline scripts/styles, so
// script/style allow 'unsafe-inline'. The value is still real — frame-ancestors,
// object-src, base-uri and a locked-down connect-src (our API + Sentry ingest).
// Enforced in production only so dev HMR/websockets aren't affected.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  `connect-src 'self' ${API_ORIGIN} https://*.ingest.sentry.io https://*.ingest.us.sentry.io`,
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  ...(isProd ? [{ key: "Content-Security-Policy", value: csp }] : []),
];

// Where the /api/backend/* proxy forwards to. Same-origin proxying is what
// makes the httpOnly session cookie *first-party* in every browser (Safari
// blocks third-party cookies outright, so calling the Render origin directly
// from the browser would break sign-in there).
const proxyTarget =
  process.env.API_PROXY_TARGET ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://arbflow-backend.onrender.com");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Type errors now fail the build (as they should). The old
  // `typescript.ignoreBuildErrors` escape hatch was removed once the
  // outstanding framer-motion `Variants` type errors were fixed.
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async rewrites() {
    // Browser calls /api/backend/api/v1/... on OUR origin; Next forwards it to
    // the FastAPI backend. Set-Cookie in the response lands on our origin.
    return [{ source: "/api/backend/:path*", destination: `${proxyTarget}/:path*` }];
  },
};

export default withSentryConfig(nextConfig, {
  // Never let Sentry's build step fail or spam the build.
  silent: true,
  // Only upload source maps when a build-time auth token is present (set in the
  // deploy env). Local, CI, and token-less prod builds skip upload entirely, so
  // this can't break the build.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
