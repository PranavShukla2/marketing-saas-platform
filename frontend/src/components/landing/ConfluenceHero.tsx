"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Button } from "../ui";
import { DURATION, EASE_OUT } from "../../lib/motion";
import ConfluenceScene from "../confluence/ConfluenceScene";
import { ENTRY } from "../confluence/sim";
import { riverPoint } from "../confluence/poster";
import Flo from "./Flo";

/**
 * Hero: the Confluence (Part II, Phase 8). Deep water in both themes; three
 * tributaries in their source colours meet at a narrows and leave as one calm
 * violet line — which is also the sparkline the value tag rides.
 *
 * Everything anchored to the water (source labels, the value tag, Flo) is
 * positioned from the same geometry the scene uses, as percentages, so it
 * lines up server-side with no measuring and no layout shift.
 */

const SOURCES = [
  { label: "GA4", color: "var(--hero-ga4)" },
  { label: "Meta Ads", color: "var(--hero-meta)" },
  { label: "LinkedIn", color: "var(--hero-linkedin)" },
];

const TAG = riverPoint(0.86);
const FLO = riverPoint(0.64);

const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.step, ease: EASE_OUT } },
};

export default function ConfluenceHero() {
  return (
    <section
      // -mt cancels the marketing layout's clearance padding so the water runs
      // under the floating nav pill; the clearance moves inside, as pt.
      className="deep-water relative -mt-20 flex min-h-[100svh] flex-col overflow-hidden sm:-mt-24"
      aria-labelledby="hero-title"
    >
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        className="relative z-10 mx-auto max-w-4xl px-6 pt-28 text-center sm:pt-36"
      >
        <motion.p variants={rise} className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--hero-ink-3)]">
          for agencies · in open beta
        </motion.p>

        <motion.h1
          id="hero-title"
          variants={rise}
          className="mt-5 text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.04em] text-[#eef1f8] sm:text-[4.25rem]"
        >
          Three platforms.
          <br />
          <span className="accent-serif text-[#b9a8ff]">One calm current.</span>
        </motion.h1>

        <motion.p variants={rise} className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--hero-ink-2)] sm:text-xl">
          ArbFlow pulls every client&apos;s GA4, Meta and LinkedIn into one white-labeled workspace — and tells you, in a
          sentence, when something changes.
        </motion.p>

        <motion.div variants={rise} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" pill className="px-7 shadow-[0_12px_36px_rgba(119,86,255,0.45)]">
            <Link href="/register">Get started free</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            pill
            className="border border-white/15 bg-white/[0.04] px-7 text-[#eef1f8] hover:bg-white/10 hover:text-white"
          >
            <a href="#features">See how it works</a>
          </Button>
        </motion.div>
        <motion.p variants={rise} className="mt-4 font-mono text-[11px] text-[var(--hero-ink-3)]">
          free while in beta · no card
        </motion.p>
      </motion.div>

      {/* The water takes the rest of the first screen. Its height comes from
          CSS alone, so nothing shifts when the live scene replaces the poster. */}
      <div className="relative mt-6 min-h-[240px] flex-1 sm:mt-8">
        <ConfluenceScene className="absolute inset-0" />

        <ul className="pointer-events-none absolute inset-0" aria-label="Sources ArbFlow connects">
          {SOURCES.map((s, i) => (
            <li
              key={s.label}
              className="absolute left-3 flex -translate-y-1/2 items-center gap-1.5 font-mono text-[11px] text-[var(--hero-ink-2)] sm:left-6"
              style={{ top: `${ENTRY[i] * 100}%` }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>

        {/* Flo rides the calm line. */}
        <div
          className="absolute hidden -translate-x-1/2 -translate-y-full sm:block"
          style={{ left: `${FLO.x * 100}%`, top: `calc(${FLO.y * 100}% - 6px)` }}
        >
          <Flo size={52} tappable />
        </div>

        {/* The line is a sparkline; this is its latest point. Sample data, and
            labelled so — it must never read as a customer's numbers. */}
        <div
          className="pointer-events-none absolute hidden -translate-x-full -translate-y-[130%] whitespace-nowrap rounded-xl border border-white/10 bg-[#0e1424]/80 px-3 py-2 text-left backdrop-blur-sm sm:block"
          style={{ left: `${TAG.x * 100}%`, top: `${TAG.y * 100}%` }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--hero-ink-3)]">
            sessions · all sources <span className="ml-1 rounded bg-white/10 px-1 normal-case tracking-normal">sample</span>
          </p>
          <p className="mt-0.5 font-mono text-lg tabular-nums text-[#eef1f8]">
            48,167 <span className="text-sm text-[var(--hero-linkedin)]">▲ 12.4%</span>
          </p>
        </div>
        <span
          className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--hero-unified)] shadow-[0_0_0_4px_rgba(139,109,255,0.25)]"
          style={{ left: `${TAG.x * 100}%`, top: `${TAG.y * 100}%` }}
          aria-hidden="true"
        />

        {/* Surfacing: the water gives way to the page below it. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[var(--page)]" />
      </div>
    </section>
  );
}
