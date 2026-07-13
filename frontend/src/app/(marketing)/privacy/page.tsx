import type { Metadata } from "next";
import LegalPage from "../../../components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy · ArbFlow",
  description: "How ArbFlow collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="July 2026"
      intro={
        <p>
          ArbFlow (&quot;we&quot;, &quot;us&quot;) provides marketing-analytics
          dashboards for agencies. This policy explains what we collect, why, and
          the choices you have. We aim to collect as little as possible and never
          sell your data.
        </p>
      }
      sections={[
        {
          heading: "Information we collect",
          body: (
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Account data</strong> — your name/company, email, and a securely hashed password (bcrypt). We never store your password in plain text.</li>
              <li><strong>Connected-source credentials</strong> — when you link Google Analytics (or, in future, Meta/LinkedIn), we store the OAuth access/refresh tokens <strong>encrypted at rest</strong> (Fernet/AES). We never see or store your Google password.</li>
              <li><strong>Analytics data</strong> — we fetch reporting metrics from your connected sources to render your dashboards. We request read-only scopes.</li>
              <li><strong>Basic technical data</strong> — IP address and request metadata, used for security (rate limiting) and reliability.</li>
            </ul>
          ),
        },
        {
          heading: "How we use it",
          body: (
            <p>
              To operate the product: authenticate you, render your dashboards,
              generate reports, and keep the service secure and reliable. We do not
              use your analytics data for advertising and we do not sell it.
            </p>
          ),
        },
        {
          heading: "Third-party services",
          body: (
            <p>
              We rely on infrastructure providers to run ArbFlow — hosting (Vercel,
              Render), a managed Postgres database (Neon), and the analytics APIs you
              connect (e.g. Google Analytics). Your data is processed by these
              providers only to deliver the service.
            </p>
          ),
        },
        {
          heading: "Cookies",
          body: (
            <p>
              ArbFlow uses only <strong>strictly necessary</strong> cookies: a
              short-lived session cookie and a refresh cookie that keep you signed
              in. Both are httpOnly and Secure. We set no advertising, tracking, or
              third-party cookies — which is why you don&apos;t see a cookie banner.
              Signing out removes them.
            </p>
          ),
        },
        {
          heading: "Data retention & deletion",
          body: (
            <p>
              We keep your data while your account is active. You can delete your
              account at any time from <strong>Settings → Profile → Danger zone</strong>;
              this permanently removes your account and all connected-source
              credentials. You may also email us to request export or deletion.
            </p>
          ),
        },
        {
          heading: "Your rights (GDPR/CCPA)",
          body: (
            <p>
              Depending on where you live, you may have the right to access,
              correct, export, or delete your personal data, and to withdraw consent.
              Contact us to exercise these rights; disconnecting a data source or
              deleting your account takes effect immediately.
            </p>
          ),
        },
        {
          heading: "Security",
          body: (
            <p>
              Credentials are encrypted at rest, passwords are hashed, sign-in is
              rate-limited, and access to your workspace requires authentication.
              No system is perfectly secure, but we take reasonable measures to
              protect your data and continue to harden the platform.
            </p>
          ),
        },
        {
          heading: "Changes to this policy",
          body: (
            <p>
              We may update this policy as the product evolves. Material changes
              will be reflected by the &quot;Last updated&quot; date above.
            </p>
          ),
        },
      ]}
    />
  );
}
