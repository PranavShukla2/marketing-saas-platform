import Link from "next/link";
import { Card } from "../ui";

type Section = { heading: string; body: React.ReactNode };

/**
 * The shared prose layout for Privacy and Terms.
 *
 * It replaces a version that numbered its own headings (`${i + 1}.`) and gave
 * each section a bare `<h2>` with no anchor, so there was no way to link
 * anyone to a specific clause — which is most of what a legal page is for in
 * practice. Sections now carry generated ids and a contents list.
 */
function slug(heading: string): string {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: React.ReactNode;
  sections: Section[];
}) {
  return (
    <div className="min-h-screen bg-[var(--page)] px-6 pb-24 pt-10 text-[var(--ink)]">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs tracking-wide text-[var(--ink-3)]">── legal</p>
        <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-[var(--ink-3)]">Last updated {updated}</p>

        <div className="mt-8 leading-relaxed text-[var(--ink-2)]">{intro}</div>

        <Card padding="md" className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-3)]">On this page</h2>
          <ol className="mt-3 space-y-1.5">
            {sections.map((s, i) => (
              <li key={s.heading} className="text-sm">
                <a
                  href={`#${slug(s.heading)}`}
                  className="rounded text-[var(--ink-2)] outline-none transition-colors hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <span className="mr-2 tabular-nums text-[var(--ink-3)]">{i + 1}.</span>
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </Card>

        <div className="mt-12 space-y-10">
          {sections.map((s, i) => (
            <section key={s.heading} id={slug(s.heading)} className="scroll-mt-28">
              <h2 className="text-lg font-semibold text-[var(--ink)]">
                <span className="mr-2 tabular-nums text-[var(--ink-3)]">{i + 1}.</span>
                {s.heading}
              </h2>
              {/* `prose-legal` lives in globals.css so paragraph rhythm, lists
                  and links are styled once rather than per clause. */}
              <div className="prose-legal mt-2 space-y-3 leading-relaxed text-[var(--ink-2)]">{s.body}</div>
            </section>
          ))}
        </div>

        <div className="mt-14 border-t border-[var(--line)] pt-8 text-sm text-[var(--ink-3)]">
          Questions? Email{" "}
          <a href="mailto:pranavmshukla@gmail.com" className="text-[var(--accent)] hover:underline">
            pranavmshukla@gmail.com
          </a>
          . See also our{" "}
          <Link href="/privacy" className="text-[var(--accent)] hover:underline">Privacy Policy</Link> and{" "}
          <Link href="/terms" className="text-[var(--accent)] hover:underline">Terms of Service</Link>.
        </div>
      </div>
    </div>
  );
}

export default LegalPage;
