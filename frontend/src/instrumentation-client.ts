// Client-side Sentry init. Gated on NEXT_PUBLIC_SENTRY_DSN so that without the
// env var (local dev, and prod until the DSN is set) this is completely inert.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    enabled: process.env.NODE_ENV === "production",
    tracesSampleRate: 0.1,
    // Keep noise low until we know what we care about.
    debug: false,
  });
}

// Instruments App Router navigations (safe no-op if Sentry wasn't initialized).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
