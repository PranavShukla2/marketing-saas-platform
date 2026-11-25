"use client";

import Link from "next/link";
import { Button } from "../ui";
import Reveal from "../motion/Reveal";

/**
 * The close: back to deep water, where the page started, and the calm line
 * running out to the action. No gradient-shimmer buttons and no mascot — the
 * hero already made the introduction.
 */
export default function FinalCta() {
  return (
    <section id="final-cta" aria-labelledby="final-cta-title" className="deep-water relative overflow-hidden px-6 py-28 sm:py-36">
      <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full" viewBox="0 0 1200 160" preserveAspectRatio="none">
        <defs>
          <linearGradient id="cta-line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--hero-unified)" stopOpacity="0" />
            <stop offset="0.35" stopColor="var(--hero-unified)" stopOpacity="0.9" />
            <stop offset="1" stopColor="var(--hero-unified)" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((k) => (
          <path
            key={k}
            d={`M0 ${118 + k * 3} C 300 ${118 + k * 3}, 520 ${96 + k * 3}, 760 ${82 + k * 3} S 1100 ${60 + k * 3}, 1200 ${52 + k * 3}`}
            fill="none"
            stroke="url(#cta-line)"
            strokeOpacity={1 - Math.abs(k - 2) * 0.3}
            strokeWidth={1.2}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <Reveal className="relative mx-auto max-w-2xl text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--hero-ink-3)]">free while in beta</p>
        <h2 id="final-cta-title" className="mt-5 text-[2.3rem] font-semibold leading-[1.05] tracking-[-0.035em] text-[#eef1f8] sm:text-6xl">
          Give every client <span className="accent-serif text-[#b9a8ff]">a calm view.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-[var(--hero-ink-2)]">
          Connect your first client in a couple of minutes. No card, nothing to install.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" pill className="px-7 shadow-[0_12px_36px_rgba(119,86,255,0.45)]">
            <Link href="/register">Create your workspace</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            pill
            className="border border-white/15 bg-white/[0.04] px-7 text-[#eef1f8] hover:bg-white/10 hover:text-white"
          >
            <Link href="/pricing">See pricing</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
