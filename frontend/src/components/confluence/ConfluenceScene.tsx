"use client";

import { useEffect, useRef, useState } from "react";
import { POSTER_BOX, posterPaths } from "./poster";
import { cn } from "../../lib/cn";

/**
 * The hero's water: a static SVG poster that is always there, and the live
 * WebGL scene layered over it when — and only when — it should run.
 *
 * Poster only, never the scene, when the visitor has asked for less motion,
 * is on Save-Data, is on a ≤2-core device, or has no WebGL2. Otherwise the
 * scene's code (~2.3 KB gzip) is imported after the page has loaded and the
 * browser is idle, so it never competes with the headline for LCP; it warms up
 * hidden and fades in over the poster once its trails have formed. It pauses
 * when scrolled out of view or the tab is hidden, and follows reduced-motion
 * changes live.
 */

const SOURCE_STROKE = ["var(--hero-ga4)", "var(--hero-meta)", "var(--hero-linkedin)"];
const WARMUP_FRAMES = 40;

function shouldStayStill() {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return true;
  if ((navigator.hardwareConcurrency || 4) <= 2) return true;
  return false;
}

export default function ConfluenceScene({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const host = hostRef.current!;
    const canvas = canvasRef.current!;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let stop: (() => void) | null = null;
    let cancelled = false;

    async function start() {
      if (stop || cancelled || shouldStayStill()) return;
      const [{ createField, step }, { createWebglRenderer }] = await Promise.all([
        import("./sim"),
        import("./render-webgl"),
      ]);
      if (cancelled || shouldStayStill()) return;
      const renderer = createWebglRenderer(canvas);
      if (!renderer) return; // no WebGL2: the poster is the hero

      const g = { w: 1, h: 1 };
      const pointer = { x: 0, y: 0, active: false };
      const fit = () => {
        const r = canvas.getBoundingClientRect();
        g.w = Math.max(1, r.width);
        g.h = Math.max(1, r.height);
        renderer.resize(g.w, g.h, Math.min(window.devicePixelRatio || 1, 1.5));
      };
      fit();
      // Particle count follows area, so a phone isn't asked to push a
      // desktop's worth of water.
      const n = Math.round(Math.min(4200, Math.max(900, (g.w * g.h) / 150)));
      const field = createField(n, g);

      const onMove = (e: PointerEvent) => {
        const r = canvas.getBoundingClientRect();
        pointer.x = e.clientX - r.left;
        pointer.y = e.clientY - r.top;
        pointer.active = true;
      };
      const onLeave = () => { pointer.active = false; };
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
      const ro = new ResizeObserver(fit);
      ro.observe(canvas);

      let raf = 0, last = performance.now(), t = 0, frames = 0, visible = true;
      const frame = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        t += dt;
        step(field, g, dt, t, pointer);
        renderer.draw(field, g.w, g.h);
        if (++frames === WARMUP_FRAMES) setLive(true);
        raf = requestAnimationFrame(frame);
      };
      const run = () => {
        cancelAnimationFrame(raf);
        if (visible && !document.hidden) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
          host.dataset.state = "live";
        } else {
          host.dataset.state = "paused";
        }
      };
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); });
      io.observe(host);
      document.addEventListener("visibilitychange", run);
      run();

      stop = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", run);
        host.removeEventListener("pointermove", onMove);
        host.removeEventListener("pointerleave", onLeave);
        renderer.dispose();
        stop = null;
        host.dataset.state = "poster";
        setLive(false);
      };
    }

    // Reduced motion switched on mid-visit: stop and leave the poster.
    // Switched off: start.
    const onMotion = () => (motion.matches ? stop?.() : void start());
    motion.addEventListener("change", onMotion);

    // After load and idle — the headline is the LCP, not this.
    // Safari only recently gained requestIdleCallback; the types assume it.
    const idle = (cb: () => void) =>
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(cb, { timeout: 2500 })
        : setTimeout(cb, 1200);
    const kick = () => idle(() => void start());
    if (document.readyState === "complete") kick();
    else window.addEventListener("load", kick, { once: true });

    return () => {
      cancelled = true;
      motion.removeEventListener("change", onMotion);
      window.removeEventListener("load", kick);
      stop?.();
    };
  }, []);

  const paths = posterPaths();

  return (
    // cn(), not string concatenation: a caller's `absolute inset-0` has to
    // replace the default `relative`. Concatenated, `relative` won and the
    // host collapsed to zero height — the scene drew into nothing.
    // data-state (poster | live | paused) is written straight to the element,
    // not React state, so it costs no re-render — it's there to be observed.
    <div ref={hostRef} data-state="poster" className={cn("relative", className)}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${POSTER_BOX.w} ${POSTER_BOX.h}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {SOURCE_STROKE.map((c, s) => (
            // Each tributary carries its source colour most of the way, then
            // crosses to unified violet as it reaches the narrows.
            <linearGradient key={s} id={`cf-src-${s}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={POSTER_BOX.w * 0.42} y2="0">
              <stop offset="0.72" stopColor={c} />
              <stop offset="1" stopColor="var(--hero-unified)" />
            </linearGradient>
          ))}
        </defs>
        {paths.map((p, i) => (
          <path
            key={i}
            // The trace runs sin/cos, which Node and the browser may round
            // differently in the last bit, and integration carries that along
            // a streamline: the client's `d` can differ from the server's at
            // the first decimal. Sub-pixel, so the server's path stands.
            suppressHydrationWarning
            d={p.d}
            fill="none"
            stroke={p.source === -1 ? "var(--hero-unified)" : `url(#cf-src-${p.source})`}
            strokeWidth={p.width}
            strokeOpacity={p.opacity}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full transition-opacity ease-[var(--ease-house)]"
        style={{ opacity: live ? 1 : 0, transitionDuration: "var(--dur-reveal)" }}
      />
    </div>
  );
}
