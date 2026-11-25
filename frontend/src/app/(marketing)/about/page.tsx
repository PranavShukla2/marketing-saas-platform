import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "../../../components/ui";

/**
 * About ArbFlow — a company page, not a personal one. What it is, where it
 * stands today (including what isn't built yet), how it's built, and who
 * builds it. A server component: nothing on it needs the client.
 */

const STATUS = [
  {
    label: "Live",
    live: true,
    items: [
      "Google Analytics 4 — connect, sync every 30 minutes, five workspace sections",
      "Plain-English anomaly alerts and a weekly digest",
      "Branding, scheduled client reports and PDF export",
      "Teams with admin, member and viewer roles",
    ],
  },
  {
    label: "Next",
    live: false,
    items: ["Meta Ads (Facebook & Instagram)", "LinkedIn Ads", "Billing, once the beta ends — with plenty of notice"],
  },
];

const PRINCIPLES = [
  {
    title: "Honest numbers",
    body: "Figures come from the source APIs as they are. Sample data is labelled as sample, and an alert only fires on a move that's genuinely out of the ordinary.",
  },
  {
    title: "Your clients' trust",
    body: "A client's access is the most sensitive thing an agency holds. Tokens are encrypted before they're stored, and every client lives in its own workspace.",
  },
  {
    title: "Calm by design",
    body: "One consistent view per client and one sentence when something changes — instead of a dozen tabs and a chart to squint at.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-[var(--page)] text-[var(--ink)]">
      <section className="mx-auto max-w-3xl px-6 pb-20 pt-16 sm:pt-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ink-3)]">about</p>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-6xl">
          Analytics agencies can <span className="accent-serif">hand to clients.</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-[var(--ink-2)] sm:text-xl">
          ArbFlow gives a marketing agency one calm, white-labeled workspace per client — the client&apos;s analytics in a
          consistent view, and a plain sentence the moment something changes. It started from a simple frustration:
          agencies juggling a dozen Google Analytics tabs and still not knowing what had moved, or why.
        </p>
      </section>

      <section className="border-t border-[var(--line)] px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Where it stands</h2>
            <p className="mt-3 text-[var(--ink-2)]">
              ArbFlow is in open beta and free to use. This is exactly what works today, and what&apos;s being built next.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {STATUS.map((g) => (
              <div key={g.label} className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-rest)]">
                <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)]">
                  <span className={`size-1.5 rounded-full ${g.live ? "bg-[var(--source-linkedin)]" : "bg-[var(--ink-3)]"}`} />
                  {g.label}
                </p>
                <ul className="mt-4 space-y-3 text-[15px] leading-snug text-[var(--ink)]">
                  {g.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">What we hold ourselves to</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <div key={p.title} className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-6">
                <p className="font-mono text-[11px] text-[var(--ink-3)]">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-lg font-semibold tracking-[-0.01em]">{p.title}</h3>
                <p className="mt-2 leading-relaxed text-[var(--ink-2)]">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[0.8fr_1.2fr]">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">Who builds it</h2>
          <div>
            <p className="text-lg leading-relaxed text-[var(--ink-2)]">
              ArbFlow is designed and built by <span className="font-medium text-[var(--ink)]">Pranav Shukla</span> — Next.js
              and React in front, FastAPI and PostgreSQL behind it, and the Google Analytics Data and Admin APIs underneath.
              Feedback and feature requests are genuinely welcome.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="outline" pill>
                <a href="https://github.com/PranavShukla2" target="_blank" rel="noopener noreferrer">
                  GitHub <ArrowUpRight />
                </a>
              </Button>
              <Button asChild variant="outline" pill>
                <a href="https://www.linkedin.com/in/pranav-shukla-softwaredeveloper" target="_blank" rel="noopener noreferrer">
                  LinkedIn <ArrowUpRight />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          See it with <span className="accent-serif">your own clients.</span>
        </h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" pill className="px-7">
            <Link href="/register">Create your workspace</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" pill className="px-7">
            <Link href="/pricing">See pricing</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
