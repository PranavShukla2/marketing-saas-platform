import { ENTRY, RIVER, THROAT, lineY, narrows, upstreamDir, type Geometry } from "./sim";

/**
 * The Confluence as static SVG paths — the hero's first paint, and the whole
 * hero wherever the live scene doesn't run (reduced motion, no WebGL2,
 * Save-Data, low-power devices).
 *
 * Streamlines are traced through the same flow field the particles move
 * through (`upstreamDir`), at scene time 0, so poster and scene are one
 * picture rather than an illustration of it. Drawn in a fixed nominal box and
 * stretched with non-scaling strokes, so it fills any hero without re-tracing.
 */

export const POSTER_BOX: Geometry = { w: 1200, h: 440 };

export type PosterPath = { d: string; source: 0 | 1 | 2 | -1; width: number; opacity: number };

const LINES_PER_SOURCE = 9;
const RIVER_LANES = 13;

function fmt(n: number) {
  return Math.round(n * 10) / 10;
}

function traceUpstream(y0: number, lane: number, g: Geometry): string {
  const nar = narrows(g);
  let x = 0, y = y0;
  const pts: string[] = [`M${fmt(x)} ${fmt(y)}`];
  for (let i = 0; i < 400 && x < nar.x; i++) {
    const [ux, uy] = upstreamDir(x, y, lane, g, 0);
    x += ux * 7;
    y += uy * 7;
    pts.push(`L${fmt(x)} ${fmt(y)}`);
  }
  return pts.join("");
}

function traceRiver(lane: number, g: Geometry): string {
  const nar = narrows(g);
  const pts: string[] = [];
  for (let x = nar.x; x <= g.w + 1; x += 12) {
    const taper = Math.min(1, (x - nar.x) / (g.w * 0.12));
    const y = lineY(x, g) + lane * g.h * (THROAT + (RIVER - THROAT) * taper);
    pts.push(`${pts.length ? "L" : "M"}${fmt(x)} ${fmt(y)}`);
  }
  return pts.join("");
}

let cache: PosterPath[] | null = null;

export function posterPaths(): PosterPath[] {
  if (cache) return cache;
  const g = POSTER_BOX;
  const out: PosterPath[] = [];

  for (let s = 0; s < ENTRY.length; s++) {
    for (let k = 0; k < LINES_PER_SOURCE; k++) {
      const spread = k / (LINES_PER_SOURCE - 1) - 0.5; // -0.5 … 0.5
      const y0 = g.h * ENTRY[s] + spread * g.h * 0.12;
      const lane = spread * 1.8;
      out.push({ d: traceUpstream(y0, lane, g), source: s as 0 | 1 | 2, width: 1.1, opacity: 0.38 + (1 - Math.abs(spread) * 2) * 0.35 });
    }
  }
  // A soft glow under the calm river, then its lanes.
  out.push({ d: traceRiver(0, g), source: -1, width: 22, opacity: 0.1 });
  for (let k = 0; k < RIVER_LANES; k++) {
    const lane = (k / (RIVER_LANES - 1)) * 2 - 1;
    out.push({ d: traceRiver(lane, g), source: -1, width: 1.2, opacity: 0.4 + (1 - Math.abs(lane)) * 0.45 });
  }
  cache = out;
  return out;
}

/** A point on the calm line, as fractions of the hero's scene box — for
 *  anchoring HTML (the value tag, Flo) to the river without measuring. */
export function riverPoint(xFrac: number): { x: number; y: number } {
  const g = { w: 1, h: 1 };
  return { x: xFrac, y: lineY(xFrac, g) };
}
