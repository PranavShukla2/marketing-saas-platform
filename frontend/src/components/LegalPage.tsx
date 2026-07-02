import Link from "next/link";

type Section = { heading: string; body: React.ReactNode };

export default function LegalPage({
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
    <div className="min-h-screen bg-[var(--page)] text-[var(--ink)] pt-28 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="font-mono text-xs text-[var(--ink-3)] tracking-wide mb-3">── legal</p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.025em] leading-[1.05]">{title}</h1>
        <p className="text-sm text-[var(--ink-3)] mt-3">Last updated {updated}</p>

        <div className="mt-8 text-[var(--ink-2)] leading-relaxed">{intro}</div>

        <div className="mt-10 space-y-9">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-lg font-semibold text-[var(--ink)] mb-2">{`${i + 1}. ${s.heading}`}</h2>
              <div className="text-[var(--ink-2)] leading-relaxed space-y-3">{s.body}</div>
            </section>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-[var(--line)] text-sm text-[var(--ink-3)]">
          Questions? Email{" "}
          <a href="mailto:pranavmshukla@gmail.com" className="text-[var(--indigo)] hover:underline">
            pranavmshukla@gmail.com
          </a>
          . See also our{" "}
          <Link href="/privacy" className="text-[var(--indigo)] hover:underline">Privacy Policy</Link> and{" "}
          <Link href="/terms" className="text-[var(--indigo)] hover:underline">Terms of Service</Link>.
        </div>
      </div>
    </div>
  );
}
