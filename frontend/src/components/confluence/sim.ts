/**
 * The Confluence simulation — renderer-agnostic, so the Phase 7 spike compares
 * Canvas 2D and WebGL on identical work, and Phase 8 keeps whichever wins.
 *
 * Three tributaries (GA4, Meta, LinkedIn) enter from the left, churn on a
 * cheap curl-like noise field, funnel into a narrows, and leave as one calm
 * line — the sparkline. Turbulence falls off as a particle nears the narrows;
 * after it, particles relax onto the line and their colour crosses to the
 * unified violet. State lives in typed arrays: no per-particle objects, no GC.
 */

export const SOURCES = 3;

export type Field = {
  n: number;
  x: Float32Array;
  y: Float32Array;
  /** 0..1, how far the particle's colour has crossed to unified. */
  mix: Float32Array;
  /** Per-particle lane offset, so the merged river has width. */
  lane: Float32Array;
  speed: Float32Array;
  src: Uint8Array;
};

export type Geometry = { w: number; h: number };

export type Pointer = { x: number; y: number; active: boolean };

// Where each tributary enters, as a fraction of height.
// Kept clear of the hero's bottom fade, where the page surfaces.
export const ENTRY = [0.18, 0.46, 0.74];

/** Half-width of the narrows, then of the calm river, as fractions of height.
 *  The spike aimed every particle at one point, which pinched the streams to a
 *  pin; aiming each at its own lane in a band reads as water through a throat. */
export const THROAT = 0.055;
export const RIVER = 0.035;

export function narrows(g: Geometry) {
  return { x: g.w * 0.42, y: g.h * 0.56 };
}

/** The calm line after the narrows — a gently rising sparkline. */
export function lineY(x: number, g: Geometry): number {
  const n = narrows(g);
  const t = Math.max(0, (x - n.x) / (g.w - n.x)); // 0 at the narrows, 1 at the right edge
  const rise = t * g.h * 0.2;
  const swell = Math.sin(t * Math.PI * 2.2) * g.h * 0.03 * (1 - t * 0.4);
  return n.y - rise + swell;
}

function rand(seed: number) {
  // Small LCG so a given particle count always produces the same scene.
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function createField(n: number, g: Geometry, seed = 7): Field {
  const r = rand(seed);
  const f: Field = {
    n,
    x: new Float32Array(n),
    y: new Float32Array(n),
    mix: new Float32Array(n),
    lane: new Float32Array(n),
    speed: new Float32Array(n),
    src: new Uint8Array(n),
  };
  for (let i = 0; i < n; i++) {
    f.src[i] = i % SOURCES;
    f.lane[i] = (r() - 0.5) * 2;
    f.speed[i] = 0.75 + r() * 0.5;
    // Start spread across the whole scene so the first frame is already full.
    f.x[i] = r() * g.w;
    respawnY(f, i, g, r);
    if (f.x[i] > narrows(g).x) {
      f.y[i] = lineY(f.x[i], g) + f.lane[i] * g.h * RIVER;
      f.mix[i] = 1;
    }
  }
  return f;
}

function respawnY(f: Field, i: number, g: Geometry, r: () => number) {
  f.y[i] = g.h * ENTRY[f.src[i]] + (r() - 0.5) * g.h * 0.12;
  f.mix[i] = 0;
}

const reseed = rand(99);

/**
 * Upstream flow direction (unit vector) at a point: toward this lane's place
 * in the narrows, churned by noise that calms on approach. Shared by step()
 * and the poster's streamline tracer, so the static poster is drawn by the
 * same field the live scene moves through.
 */
export function upstreamDir(x: number, y: number, lane: number, g: Geometry, t: number): [number, number] {
  const nar = narrows(g);
  const dx = nar.x - x, dy = nar.y + lane * g.h * THROAT - y;
  const d = Math.hypot(dx, dy) || 1;
  const calm = Math.max(0, x / nar.x); // 0 at entry, 1 at the narrows
  const a = Math.sin(x * 0.011 + t * 0.7) * Math.cos(y * 0.013 - t * 0.5) * Math.PI * 1.6;
  const turb = (1 - calm) * 0.9;
  let vx = (dx / d) * (1 - turb) + Math.cos(a) * turb;
  let vy = (dy / d) * (1 - turb) + Math.sin(a) * turb;
  const vl = Math.hypot(vx, vy) || 1;
  vx /= vl;
  vy /= vl;
  // Never let a stream flow backwards: water keeps heading downstream.
  return [Math.max(0.15, vx), vy];
}

/**
 * Advance every particle by `dt` seconds. `t` is scene time, used to move the
 * noise field so the water never repeats exactly.
 */
export function step(f: Field, g: Geometry, dt: number, t: number, pointer: Pointer) {
  const nar = narrows(g);
  const base = Math.max(g.w, 600) * 0.11; // px/s, scales with the scene
  const px = pointer.x, py = pointer.y, pr2 = 140 * 140;

  for (let i = 0; i < f.n; i++) {
    let x = f.x[i], y = f.y[i];
    const sp = base * f.speed[i];
    let vx: number, vy: number;

    if (x < nar.x) {
      const [ux, uy] = upstreamDir(x, y, f.lane[i], g, t);
      vx = ux * sp;
      vy = uy * sp;
    } else {
      // Downstream: ride the line, the lane tapering from throat to river width.
      const taper = Math.min(1, (x - nar.x) / (g.w * 0.12));
      const target = lineY(x, g) + f.lane[i] * g.h * (THROAT + (RIVER - THROAT) * taper);
      vx = sp * 1.15;
      vy = (target - y) * 4;
      f.mix[i] = Math.min(1, f.mix[i] + dt * 1.6);
    }

    // A hand in the water: local swirl around the pointer.
    if (pointer.active) {
      const ddx = x - px, ddy = y - py, d2 = ddx * ddx + ddy * ddy;
      if (d2 < pr2) {
        const k = (1 - d2 / pr2) * sp * 2.2;
        const d = Math.sqrt(d2) || 1;
        vx += (-ddy / d) * k;
        vy += (ddx / d) * k;
      }
    }

    x += vx * dt;
    y += vy * dt;

    if (x > g.w + 8 || y < -40 || y > g.h + 40) {
      x = -4 - reseed() * 30;
      f.x[i] = x;
      respawnY(f, i, g, reseed);
      continue;
    }
    f.x[i] = x;
    f.y[i] = y;
  }
}

/** Source colours for marks on deep water, then the unified violet. */
export const STREAM_RGB: [number, number, number][] = [
  [245, 165, 36],  // GA4    #F5A524
  [91, 155, 255],  // Meta   #5B9BFF
  [45, 212, 191],  // LinkedIn #2DD4BF
];
export const UNIFIED_RGB: [number, number, number] = [139, 109, 255]; // #8B6DFF
export const DEEP_RGB: [number, number, number] = [7, 11, 22]; // #070B16
