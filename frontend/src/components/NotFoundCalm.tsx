"use client";

import Link from "next/link";
import { Button } from "./ui";
import ConfluenceScene from "./confluence/ConfluenceScene";

/**
 * The 404: back to the deep water the site opens with, and two ways out.
 *
 * It used to be a matter-js physics toy ("Grab the pills and throw them
 * around") — fun, but it read as a side project rather than a product, and it
 * shipped a physics engine to render an error page.
 */
export default function NotFoundCalm() {
  return (
    <main className="deep-water relative flex min-h-screen flex-col overflow-hidden">
      <div className="relative z-10 mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-6 pt-24 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--hero-ink-3)]">404 · page not found</p>
        <h1 className="mt-5 text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.04em] text-[#eef1f8] sm:text-6xl">
          This page <span className="accent-serif text-[#b9a8ff]">drifted off.</span>
        </h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--hero-ink-2)]">
          The link may be old, or the page may have moved. Everything else is right where you left it.
        </p>
        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="lg" pill className="px-7">
            <Link href="/">Back to home</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            pill
            className="border border-white/15 bg-white/[0.04] px-7 text-[#eef1f8] hover:bg-white/10 hover:text-white"
          >
            <Link href="/dashboard">Go to your workspace</Link>
          </Button>
        </div>
      </div>
      {/* The same water as the hero, quieter: it sits below the message. */}
      <ConfluenceScene className="relative h-[clamp(200px,34vh,360px)] w-full shrink-0 opacity-80" />
    </main>
  );
}
