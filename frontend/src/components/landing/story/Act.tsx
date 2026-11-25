"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "../../../lib/cn";
import Reveal from "../../motion/Reveal";

/**
 * The landing's story is told in acts (Part II, Phase 9). Each act states one
 * thing the product does *today* and shows the real thing doing it — nothing
 * here describes a feature that isn't built.
 */

export type ActMeta = { id: string; label: string };

export const ACTS: ActMeta[] = [
  { id: "connect", label: "Connect" },
  { id: "one-view", label: "One view" },
  { id: "ripples", label: "Ripples" },
  { id: "your-brand", label: "Your brand" },
  { id: "vault", label: "Vault" },
];

export function Act({
  index,
  title,
  body,
  facts,
  visual,
  layout = "split",
  flip = false,
}: {
  /** Position in ACTS, which supplies the id and eyebrow label. */
  index: number;
  title: React.ReactNode;
  body: React.ReactNode;
  facts?: React.ReactNode[];
  visual: React.ReactNode;
  /** split: copy beside the visual. stacked: copy above a full-width visual. */
  layout?: "split" | "stacked";
  flip?: boolean;
}) {
  const act = ACTS[index];
  const copy = (
    <Reveal className={cn(layout === "stacked" && "mx-auto max-w-2xl text-center")}>
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
        {String(index + 1).padStart(2, "0")} · {act.label}
      </p>
      <h2 id={`${act.id}-title`} className="mt-4 text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--ink)] sm:text-5xl">
        {title}
      </h2>
      <div className="mt-5 text-lg leading-relaxed text-[var(--ink-2)]">{body}</div>
      {facts && (
        <ul className={cn("mt-7 space-y-3", layout === "stacked" && "mx-auto inline-block text-left")}>
          {facts.map((f, i) => (
            <li key={i} className="flex items-start gap-3 text-[15px] leading-snug text-[var(--ink)]">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--unified)]/12 text-[var(--accent)]">
                <Check className="size-3" strokeWidth={3} />
              </span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
    </Reveal>
  );

  return (
    <section id={act.id} data-act={index} aria-labelledby={`${act.id}-title`} className="scroll-mt-24 px-6 py-24 sm:py-32">
      {layout === "stacked" ? (
        <div className="mx-auto max-w-6xl">
          {copy}
          <Reveal delay={0.08} className="mt-14">{visual}</Reveal>
        </div>
      ) : (
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className={cn(flip && "lg:order-2")}>{copy}</div>
          <Reveal delay={0.08} className={cn(flip && "lg:order-1")}>{visual}</Reveal>
        </div>
      )}
    </section>
  );
}

/**
 * A fixed index down the right edge on wide screens: which act you're in, and
 * a way to jump between them. It shows only while an act is on screen, so it
 * never sits over the hero or the footer.
 */
export function ActRail() {
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const sections = ACTS.map((a) => document.getElementById(a.id)).filter(Boolean) as HTMLElement[];
    const seen = new Map<number, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(Number((e.target as HTMLElement).dataset.act), e.intersectionRatio);
        let best = -1, ratio = 0;
        seen.forEach((r, i) => { if (r > ratio) { ratio = r; best = i; } });
        setActive(ratio > 0.15 ? best : -1);
      },
      { threshold: [0, 0.15, 0.3, 0.5, 0.75] }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <nav
      aria-label="Story"
      className={cn(
        "fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 transition-opacity duration-[var(--dur-step)] xl:block",
        active < 0 ? "pointer-events-none opacity-0" : "opacity-100"
      )}
    >
      <ol className="space-y-1">
        {ACTS.map((a, i) => {
          const on = i === active;
          return (
            <li key={a.id}>
              <a
                href={`#${a.id}`}
                aria-current={on ? "step" : undefined}
                className="group flex items-center justify-end gap-3 py-1 font-mono text-[11px] tracking-[0.08em]"
              >
                <span
                  className={cn(
                    "transition-[opacity,color] duration-[var(--dur-panel)]",
                    on ? "text-[var(--ink)] opacity-100" : "text-[var(--ink-3)] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                  )}
                >
                  {a.label}
                </span>
                <span className={cn("tabular-nums transition-colors", on ? "text-[var(--accent)]" : "text-[var(--ink-3)]")}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-px transition-[width,background-color] duration-[var(--dur-step)]",
                    on ? "w-8 bg-[var(--accent)]" : "w-4 bg-[var(--line)] group-hover:bg-[var(--ink-3)]"
                  )}
                />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** A browser window around a product visual, so it reads as the app itself. */
export function BrowserFrame({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-overlay)]", className)}>
      <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--page)] px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[var(--line)]" />
          <span className="size-2.5 rounded-full bg-[var(--line)]" />
          <span className="size-2.5 rounded-full bg-[var(--line)]" />
        </span>
        <span className="truncate font-mono text-[11px] text-[var(--ink-3)]">{title}</span>
      </div>
      {children}
    </div>
  );
}
