"use client";

import { useEffect, useRef, useState } from "react";
import { createField, step, type Geometry, type Pointer } from "./sim";
import { createCanvasRenderer } from "./render-canvas";
import { createWebglRenderer } from "./render-webgl";

export type Impl = "canvas" | "webgl";

type Stats = { impl: string; n: number; frameMs: number[]; workMs: number[] };

declare global {
  interface Window { __confluence?: Stats }
}

/**
 * Phase 7 spike harness: runs the Confluence simulation through either
 * renderer and records, per frame, the interval between frames and the time
 * spent in sim + draw. Playwright reads `window.__confluence` to compare the
 * two under CPU throttling. Not the production hero — Phase 8 builds that on
 * whichever renderer this picks.
 */
export default function ConfluenceLab({ impl, n }: { impl: Impl; n: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState({ fps: 0, work: 0, used: impl as string });

  useEffect(() => {
    const canvas = ref.current!;
    // No silent fallback here: a canvas that has handed out a WebGL context
    // can't give a 2D one, and the spike should say plainly when WebGL failed.
    // (Phase 8's fallback for that case is the static poster.)
    const renderer = impl === "webgl" ? createWebglRenderer(canvas) : createCanvasRenderer(canvas);
    if (!renderer) {
      setLive({ fps: 0, work: 0, used: "webgl2 unavailable" });
      return;
    }
    const g: Geometry = { w: 1, h: 1 };
    const pointer: Pointer = { x: 0, y: 0, active: false };
    const stats: Stats = { impl: renderer.name, n, frameMs: [], workMs: [] };
    window.__confluence = stats;

    const fit = () => {
      const r = canvas.getBoundingClientRect();
      g.w = r.width;
      g.h = r.height;
      renderer.resize(g.w, g.h, Math.min(window.devicePixelRatio || 1, 1.5));
    };
    fit();
    const field = createField(n, g);
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
    };
    const leave = () => { pointer.active = false; };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);

    let raf = 0, last = performance.now(), t = 0, tick = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      stats.frameMs.push(now - last);
      last = now;
      t += dt;
      const w0 = performance.now();
      step(field, g, dt, t, pointer);
      renderer.draw(field, g.w, g.h);
      stats.workMs.push(performance.now() - w0);
      if (++tick % 30 === 0) {
        const f = stats.frameMs.slice(-30), w = stats.workMs.slice(-30);
        setLive({
          fps: Math.round(1000 / (f.reduce((a, b) => a + b, 0) / f.length)),
          work: +(w.reduce((a, b) => a + b, 0) / w.length).toFixed(2),
          used: renderer.name,
        });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // Never burn a background tab's battery.
    const vis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
    };
    document.addEventListener("visibilitychange", vis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", vis);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      renderer.dispose();
    };
  }, [impl, n]);

  return (
    <div className="relative h-[70vh] min-h-[420px] w-full overflow-hidden rounded-[var(--radius-lg)] bg-[var(--deep)]">
      <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1.5 font-mono text-xs tabular-nums text-[#eef1f8]">
        {live.used} · {n.toLocaleString()} particles · {live.fps} fps · {live.work} ms/frame
      </div>
    </div>
  );
}
