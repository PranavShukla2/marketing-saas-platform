import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Type errors now fail the build (as they should). The old
  // `typescript.ignoreBuildErrors` escape hatch was removed once the
  // outstanding framer-motion `Variants` type errors were fixed.
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
