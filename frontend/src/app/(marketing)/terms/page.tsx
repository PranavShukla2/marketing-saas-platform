import type { Metadata } from "next";
import LegalPage from "../../../components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service · ArbFlow",
  description: "The terms that govern your use of ArbFlow.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="July 2026"
      intro={
        <p>
          These terms govern your use of ArbFlow. By creating an account or using
          the service, you agree to them. ArbFlow is currently offered as an
          early-stage/beta product.
        </p>
      }
      sections={[
        {
          heading: "Your account",
          body: (
            <p>
              You&apos;re responsible for the activity under your account and for
              keeping your credentials secure. Provide accurate information and let
              us know if you suspect unauthorized access. You must be able to form a
              binding contract to use ArbFlow.
            </p>
          ),
        },
        {
          heading: "Acceptable use",
          body: (
            <p>
              Don&apos;t misuse the service: no attempting to breach or probe our
              security, no reverse-engineering, no overwhelming the infrastructure,
              and no using ArbFlow to access data you aren&apos;t authorized to see.
              You must have the right to connect any data source you link.
            </p>
          ),
        },
        {
          heading: "Connected data sources",
          body: (
            <p>
              When you connect a source (e.g. Google Analytics), you authorize
              ArbFlow to fetch read-only reporting data on your behalf to render your
              dashboards. You can disconnect a source or delete your account at any
              time, which revokes our stored access.
            </p>
          ),
        },
        {
          heading: "Beta service & availability",
          body: (
            <p>
              ArbFlow is provided &quot;as is&quot; during this stage. We aim for high
              availability but don&apos;t guarantee uninterrupted service, and
              features may change. Some data shown may be sample data where a live
              integration isn&apos;t connected — this is clearly labelled in-product.
            </p>
          ),
        },
        {
          heading: "Limitation of liability",
          body: (
            <p>
              To the maximum extent permitted by law, ArbFlow is not liable for
              indirect or consequential damages, or for decisions made based on the
              analytics displayed. Your use of the service is at your own risk.
            </p>
          ),
        },
        {
          heading: "Termination",
          body: (
            <p>
              You may stop using ArbFlow and delete your account at any time. We may
              suspend or terminate accounts that violate these terms or put the
              service or other users at risk.
            </p>
          ),
        },
        {
          heading: "Changes to these terms",
          body: (
            <p>
              We may update these terms as the product matures. Continued use after
              changes means you accept the updated terms; the &quot;Last updated&quot;
              date above reflects the current version.
            </p>
          ),
        },
      ]}
    />
  );
}
