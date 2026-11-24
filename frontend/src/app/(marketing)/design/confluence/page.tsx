"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Impl } from "../../../../components/confluence/ConfluenceLab";

// Client-only: the harness touches canvas and window from the first frame.
const ConfluenceLab = dynamic(() => import("../../../../components/confluence/ConfluenceLab"), { ssr: false });

const COUNTS = [2000, 4000, 8000];

/**
 * /design/confluence — the Phase 7 hero spike. Not linked from the site;
 * a reference area like /design itself.
 */
function Lab() {
  const q = useSearchParams();
  const impl: Impl = q.get("impl") === "webgl" ? "webgl" : "canvas";
  const n = Math.min(20000, Math.max(200, Number(q.get("n")) || 4000));

  return (
    <div className="min-h-screen bg-[var(--page)] px-6 py-16">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-3)]">Phase 7 · spike</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
            The Confluence, <span className="accent-serif">two ways</span>
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--ink-2)]">
            Same simulation, two renderers. Move the pointer through the water. The pill reports frame rate and the
            time each frame spends in simulation plus drawing.
          </p>
        </header>
        <nav className="flex flex-wrap gap-2 text-sm">
          {(["canvas", "webgl"] as const).flatMap((i) =>
            COUNTS.map((c) => {
              const on = i === impl && c === n;
              return (
                <Link
                  key={`${i}-${c}`}
                  href={`/design/confluence?impl=${i}&n=${c}`}
                  className={`rounded-full border px-3 py-1.5 font-mono text-xs ${on ? "border-[var(--unified)] bg-[var(--unified)] text-white" : "border-[var(--line)] text-[var(--ink-2)] hover:bg-[var(--surface)]"}`}
                >
                  {i} · {c / 1000}k
                </Link>
              );
            })
          )}
        </nav>
        <ConfluenceLab key={`${impl}-${n}`} impl={impl} n={n} />
      </div>
    </div>
  );
}

export default function ConfluenceSpikePage() {
  return (
    <Suspense>
      <Lab />
    </Suspense>
  );
}
