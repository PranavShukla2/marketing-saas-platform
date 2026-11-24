import { DEEP_RGB, STREAM_RGB, UNIFIED_RGB, type Field } from "./sim";

/**
 * Canvas 2D renderer. Trails come from painting translucent deep water over
 * the last frame instead of clearing it. Particles are batched into colour
 * buckets (3 sources × MIX_STEPS) so a frame is a handful of fill() calls, not
 * thousands of fillStyle changes.
 */
const MIX_STEPS = 6;

export function createCanvasRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { alpha: false })!;
  const buckets: string[] = [];
  for (let s = 0; s < STREAM_RGB.length; s++) {
    for (let m = 0; m < MIX_STEPS; m++) {
      const k = m / (MIX_STEPS - 1);
      const c = STREAM_RGB[s].map((v, j) => Math.round(v + (UNIFIED_RGB[j] - v) * k));
      buckets.push(`rgb(${c[0]},${c[1]},${c[2]})`);
    }
  }
  const fade = `rgba(${DEEP_RGB[0]},${DEEP_RGB[1]},${DEEP_RGB[2]},0.16)`;
  let dpr = 1;

  return {
    name: "canvas2d" as const,
    resize(w: number, h: number, ratio: number) {
      dpr = ratio;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgb(${DEEP_RGB.join(",")})`;
      ctx.fillRect(0, 0, w, h);
    },
    draw(f: Field, w: number, h: number) {
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, w, h);
      const size = 1.6;
      for (let b = 0; b < buckets.length; b++) {
        const s = Math.floor(b / MIX_STEPS), m = b % MIX_STEPS;
        ctx.beginPath();
        for (let i = 0; i < f.n; i++) {
          if (f.src[i] !== s) continue;
          if (Math.round(f.mix[i] * (MIX_STEPS - 1)) !== m) continue;
          ctx.rect(f.x[i], f.y[i], size, size);
        }
        ctx.fillStyle = buckets[b];
        ctx.fill();
      }
    },
    dispose() {},
  };
}
