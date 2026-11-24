# Technical decisions — UI overhaul

Why each tool was chosen over the obvious alternatives. Written so a future
maintainer (or me in six months) doesn't re-litigate settled questions, and so
the ones that *were* close calls are honest about the trade-off.

Rule of thumb applied throughout: **prefer what's already here, prefer
build-time over runtime, and never hand-roll accessibility.**

---

## Animation — Framer Motion (`motion` v12) ✅ *kept*

| Alternative | Why not |
|---|---|
| **GSAP** | More powerful timelines, but roughly doubles animation bundle weight, and its imperative model fights React's declarative rendering. Its licensing history has also been a recurring headache for commercial work. |
| **react-spring** | Genuinely good physics, but a smaller ecosystem today and far more verbose for the layout/exit animations that make up most of this overhaul. |
| **CSS only** | Zero JS cost and it's what we use for simple hovers — but it can't orchestrate staggered sequences, exit animations, or shared-element transitions. |

**Why Framer Motion:** it's *already a dependency*, so the bulk of the visual
upgrade costs no new bundle. It gives us three things we lean on heavily:
`layoutId` for shared-element transitions, `AnimatePresence` for exit
animations (impossible in CSS alone), and `useReducedMotion`, which we already
wrap in a hydration-safe hook.

**Trade-off accepted:** it's ~34KB gzipped. Justified because it's already
paid for and replaces hand-written animation code.

---

## Component primitives — Radix UI (styled by us, shadcn-style)

| Alternative | Why not |
|---|---|
| **MUI / Chakra / Mantine** | Complete design systems. They'd fight our Tailwind tokens, add a large runtime, and make the product look like the library rather than like ArbFlow. |
| **Headless UI** | Same idea, fewer primitives and thinner ARIA coverage. |
| **Hand-rolled** | Means re-implementing focus traps, `aria-*` wiring, roving tabindex and dismiss behaviour. We just finished an accessibility pass; this is precisely the wrong thing to DIY. |

**Why Radix:** unstyled, so the design stays ours, while keyboard and screen
reader behaviour comes correct out of the box. We copy the components into
`components/ui/` (the shadcn approach) rather than importing a styled kit, so
they're ours to edit and there's no version lock-in.

---

## Styling variants — `class-variance-authority` + `tailwind-merge` + `clsx`

| Alternative | Why not |
|---|---|
| **Template strings** (what we have now) | Falls apart at scale: no typed variants, and conflicting Tailwind classes silently resolve by source order rather than intent. |
| **styled-components / Emotion** | Runtime CSS-in-JS: extra bundle, a serialisation cost on every render, and awkward in React Server Components. |

**Why cva + tailwind-merge:** build-time, ~2KB combined, gives typed variants
(`<Button variant="ghost" size="sm">`) and makes `cn()` resolve class conflicts
correctly so overrides actually win.

---

## Icons — `lucide-react`

| Alternative | Why not |
|---|---|
| **Inline SVG** (current) | ~40 hand-pasted paths with inconsistent stroke widths and viewboxes; every icon change is a find-and-replace. |
| **react-icons** | Bundles many icon families with clashing visual styles; easy to import the whole set by accident. |
| **Heroicons** | Fine, but a smaller set and less consistent coverage for dashboard/analytics glyphs. |

**Why Lucide:** one coherent 24px/2px-stroke grid, tree-shakeable per icon, and
it inherits `currentColor` so it themes for free.

---

## Charts — `recharts` ✅ *kept, but wrapped*

| Alternative | Why not *yet* |
|---|---|
| **visx** | More control and a smaller runtime, but every chart becomes 3–5× more code. |
| **Chart.js** | Canvas-rendered: can't be styled by our CSS tokens, and it's far worse for accessibility. |
| **Nivo** | Heavy, and opinionated in ways that would fight the token system. |

**Why keep recharts:** swapping charting libraries *during* a visual overhaul
means two risky changes at once. Instead every chart goes through our own
themed wrappers, so the library becomes an implementation detail we can replace
later without touching pages.

**Trade-off stated plainly:** recharts is a large part of the dashboard bundle.
Revisit once the overhaul is stable.

---

## Geography / "where your users are" map — `d3-geo` + `topojson-client`

GA4 gives us country-level (and city-level) visitor counts, which is best read
as a **choropleth** — countries shaded by traffic — not as a street map.

| Alternative | Why not |
|---|---|
| **Mapbox GL / react-map-gl** | Built for pannable street maps with tiles. Needs an API key, bills per map load, and ships a large WebGL runtime — all wrong for shading ~200 static country shapes. |
| **Leaflet / react-leaflet** | Also tile-based, so it inherits a tile provider dependency and cost, and a choropleth is fighting the library rather than using it. |
| **react-simple-maps** | The closest fit and genuinely nice, but it wraps the same d3-geo we'd use, adds a dependency layer on top, and has lagged on React major versions before — a risk on React 19. |
| **@nivo/geo / amCharts** | Heavy, opinionated styling that would fight our tokens; amCharts also has licensing conditions. |

**Decision:** render the choropleth ourselves — `d3-geo` for the projection and
`topojson-client` to decode a world atlas, drawn as plain SVG `<path>`s. Both
are small, stable, and framework-agnostic.

**Why this is the right amount of work:** it's roughly a hundred lines, and in
return the map is *ours*: countries are SVG elements, so they take our theme
tokens, our tooltip primitive, our motion and our focus styles for free — no
API key, no tile bill, no WebGL, and it themes correctly in dark mode instead
of being a bright rectangle pasted onto a dark page.

---

## Toasts — `sonner`

Replaces a bespoke toast that exists on exactly one page. Chosen over
`react-hot-toast` for better stacking and swipe-dismiss defaults; both are
small, this one needs less styling to look right.

---

## Theme switching — our own implementation ✅ *kept, no library*

**Why not `next-themes`:** we already built and verified a no-flash,
OS-default theme system — inline script before first paint, `light | dark |
system` with system as the default, and it survives storage being blocked.
Adding a dependency to replace working, tested code is a downgrade.

---

## Glassmorphism — tokens, not a library

Implemented as theme-aware CSS variables (`--glass-bg`, `--glass-border`,
`--glass-blur`) rather than one-off `backdrop-blur` classes, for two reasons:

1. **Contrast safety.** Translucent surfaces change the effective background
   behind text. Centralising them means we tune contrast once per theme
   instead of auditing every card.
2. **Performance.** `backdrop-filter` is GPU-expensive and janky on large
   scrolling surfaces. Keeping it in tokens lets us cap where it's used, and
   drop it wholesale if a device struggles.

Applied deliberately — chrome, overlays and floating panels — not to every
card, which is what makes glass designs look muddy and hurt readability.

---

## Hero scene ("Confluence") — raw WebGL2, no three.js ✅ *Phase 7 spike*

Decided by measurement, not taste. The same simulation (`components/confluence/sim.ts`)
was run through two renderers at `/design/confluence`, and three.js + React Three
Fiber was bundled for size. Chrome, Apple M1 GPU via Metal, 1440×900:

| Renderer | gzip | Main thread per frame, 8k particles, 4× CPU throttle |
|---|---|---|
| **Raw WebGL2** | **2.3 KB** | **2.4 ms** |
| Canvas 2D | 1.4 KB | 5.4 ms |
| three.js + R3F | ~251 KB (320 KB incl. React, which the page already ships) | — |

All three hold 60fps at every count we tried, so frame rate doesn't decide it.
What does is **main-thread time** — the hero shares that thread with scrolling and
React, and WebGL2 does the same frame in under half Canvas's time — and **weight**:
R3F alone is 3.6× the whole 70 KB budget for the scene before drawing a particle.

**Why not R3F, given the animated portfolio uses it:** that site *is* the scene; a
SaaS landing page has to stay light for the people who only came to sign in. The
particle work here is a few hundred lines of plain WebGL2; a scene graph buys us
nothing we'd use.

**No-WebGL2 fallback is the static poster, not the Canvas 2D renderer.** A canvas
that has handed out a WebGL context can't give a 2D one, so a live fallback means a
second element and a second code path for ~3% of browsers. The poster is already
required for reduced motion, `saveData` and first paint, so it covers this too.

**Spike findings carried into Phase 8:** the narrows is a pinpoint and should be a
throat; the trail fade leaves faint ghost streaks (8-bit alpha never reaches the
background exactly — clear fully every N frames or fade in a float target); and the
measurements are from an M1 — re-check on a low-end Android in the Phase 12 gate.
