// Next.js server instrumentation hook. Loads the right Sentry config per
// runtime, and forwards App Router server errors to Sentry (a no-op until a
// DSN is configured).
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
