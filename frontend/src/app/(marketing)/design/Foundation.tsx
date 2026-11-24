"use client";

import { useEffect, useState } from "react";

/**
 * The Part II foundation — type, Tidewater palette and motion scale v2 —
 * shown from the live tokens. Contrast figures are computed in the browser
 * from the CSS variables as currently resolved, so they're right in whichever
 * theme is active and can't drift from globals.css.
 */

type Swatch = { token: string; label: string; role: "text" | "mark"; on?: string };

const GROUPS: { title: string; note: string; swatches: Swatch[] }[] = [
  {
    title: "Ink",
    note: "Text on paper. Every step passes 4.5:1 on page and surface.",
    swatches: [
      { token: "--ink", label: "ink", role: "text" },
      { token: "--ink-2", label: "ink-2", role: "text" },
      { token: "--ink-3", label: "ink-3", role: "text" },
      { token: "--accent", label: "accent", role: "text" },
    ],
  },
  {
    title: "Sources",
    note: "One hue per platform, everywhere. Marks pass 3:1; -ink variants are for text.",
    swatches: [
      { token: "--source-ga4", label: "GA4", role: "mark" },
      { token: "--source-meta", label: "Meta", role: "mark" },
      { token: "--source-linkedin", label: "LinkedIn", role: "mark" },
      { token: "--source-ga4-ink", label: "GA4 ink", role: "text" },
      { token: "--source-meta-ink", label: "Meta ink", role: "text" },
      { token: "--source-linkedin-ink", label: "LinkedIn ink", role: "text" },
    ],
  },
  {
    title: "Meaning",
    note: "Violet is the unified view. Coral is an anomaly — and nothing else.",
    swatches: [
      { token: "--unified", label: "unified", role: "mark" },
      { token: "--anomaly", label: "anomaly", role: "mark" },
      { token: "--anomaly-ink", label: "anomaly ink", role: "text" },
    ],
  },
];

const MOTION = [
  { token: "--dur-hover", name: "hover", use: "pointer feedback" },
  { token: "--dur-panel", name: "panel", use: "menus, tab content" },
  { token: "--dur-step", name: "step", use: "one step; most entrances" },
  { token: "--dur-merge", name: "merge", use: "things combining" },
  { token: "--dur-reveal", name: "reveal", use: "hero, large surfaces" },
];

/* ---- WCAG contrast, from whatever colour string the browser resolves ---- */
function toRgb(color: string): [number, number, number] | null {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b] = m[1].split(/[ ,/]+/).map(Number);
    return [r, g, b];
  }
  const h = color.trim().replace("#", "");
  if (/^[0-9a-f]{6}$/i.test(h)) return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
  return null;
}
function luminance([r, g, b]: [number, number, number]) {
  const f = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a: string, b: string): number | null {
  const x = toRgb(a), y = toRgb(b);
  if (!x || !y) return null;
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

/** Re-reads resolved token values whenever the theme class on <html> flips. */
function useTokens(names: string[]) {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    const read = () => {
      // Resolve through a probe element: custom properties that alias other
      // custom properties come back unresolved from getPropertyValue.
      const probe = document.createElement("span");
      document.body.appendChild(probe);
      const out: Record<string, string> = {};
      for (const n of names) {
        probe.style.color = `var(${n})`;
        out[n] = getComputedStyle(probe).color;
      }
      probe.remove();
      setValues(out);
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
    // names is a module-level constant per call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return values;
}

const ALL = [...GROUPS.flatMap((g) => g.swatches.map((s) => s.token)), "--page", "--surface"];

export default function Foundation() {
  const v = useTokens(ALL);
  const [playing, setPlaying] = useState(false);

  return (
    <div className="space-y-12">
      {/* ---------- Type ---------- */}
      <section className="space-y-4">
        <Heading title="Type" desc="Geist for everything you read, Geist Mono for every number, Instrument Serif italic for one accent phrase per heading." />
        {/* Hairline so deep water still reads as a surface on the dark theme's
            page, which is only a shade lighter. */}
        <div className="rounded-[var(--radius-lg)] border border-white/[0.06] bg-[var(--deep)] p-8 sm:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#8f98b3]">01 · Confluence</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-[#eef1f8] sm:text-6xl">
            Three platforms. <span className="accent-serif text-[#b9a8ff]">One calm current.</span>
          </p>
          <p className="mt-4 max-w-xl text-lg text-[#b3bad0]">
            Every client&apos;s GA4, Meta and LinkedIn data, arriving as one view — and a sentence when something changes.
          </p>
          <p className="mt-6 font-mono text-3xl tabular-nums text-[#eef1f8]">
            48,167 <span className="text-base text-[#2dd4bf]">▲ 12.4%</span>
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Specimen family="font-sans" name="Geist" use="UI, body, display" sample="Sessions by channel" />
          <Specimen family="font-mono" name="Geist Mono" use="numbers, labels, eyebrows" sample="1,204,880 · 4.82%" />
          <Specimen family="accent-serif" name="Instrument Serif italic" use="one accent phrase" sample="what actually changed" />
        </div>
      </section>

      {/* ---------- Colour ---------- */}
      <section className="space-y-6">
        <Heading title="Tidewater" desc="Colours carry meaning. Ratios below are measured live against this theme's page and surface." />
        {GROUPS.map((g) => (
          <div key={g.title} className="space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-sm font-semibold text-[var(--ink)]">{g.title}</h3>
              <p className="text-xs text-[var(--ink-3)]">{g.note}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {g.swatches.map((s) => {
                const min = s.role === "text" ? 4.5 : 3;
                const onPage = v[s.token] && v["--page"] ? contrast(v[s.token], v["--page"]) : null;
                const onSurface = v[s.token] && v["--surface"] ? contrast(v[s.token], v["--surface"]) : null;
                const worst = onPage && onSurface ? Math.min(onPage, onSurface) : null;
                return (
                  <div key={s.token} className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)]">
                    <div className="h-14" style={{ background: `var(${s.token})` }} />
                    <div className="space-y-0.5 p-3">
                      <p className="text-sm font-medium text-[var(--ink)]">{s.label}</p>
                      <p className="font-mono text-[11px] text-[var(--ink-3)]">{s.token}</p>
                      <p className={`font-mono text-[11px] tabular-nums ${worst !== null && worst < min ? "text-[var(--anomaly-ink)]" : "text-[var(--ink-2)]"}`}>
                        {worst === null ? "—" : `${worst.toFixed(2)}:1`} <span className="text-[var(--ink-3)]">({s.role} ≥ {min})</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* ---------- Motion ---------- */}
      <section className="space-y-4">
        <Heading title="Motion scale" desc="Five durations named for what they do, one house ease. Under reduced motion the bars jump instead of travel." />
        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-5">
          {MOTION.map((m) => (
            <div key={m.token} className="grid grid-cols-[5rem_1fr] items-center gap-4 sm:grid-cols-[6rem_1fr_10rem]">
              <p className="font-mono text-xs text-[var(--ink)]">{m.name}</p>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--line)]">
                <div
                  className="h-full w-full origin-left rounded-full bg-[var(--unified)] motion-reduce:transition-none"
                  style={{
                    transform: playing ? "scaleX(1)" : "scaleX(0.04)",
                    transition: `transform var(${m.token}) var(--ease-house)`,
                  }}
                />
              </div>
              <p className="hidden text-xs text-[var(--ink-3)] sm:block">{m.use}</p>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="mt-2 rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:bg-[var(--page)]"
          >
            {playing ? "Reset" : "Play"}
          </button>
        </div>
      </section>
    </div>
  );
}

function Heading({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--ink)]">{title}</h2>
      <p className="text-sm text-[var(--ink-3)]">{desc}</p>
    </div>
  );
}

function Specimen({ family, name, use, sample }: { family: string; name: string; use: string; sample: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-4">
      <p className={`${family} text-2xl text-[var(--ink)]`}>{sample}</p>
      <p className="mt-3 text-sm font-medium text-[var(--ink)]">{name}</p>
      <p className="text-xs text-[var(--ink-3)]">{use}</p>
    </div>
  );
}
