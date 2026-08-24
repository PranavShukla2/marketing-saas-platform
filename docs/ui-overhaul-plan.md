# UI overhaul — phased plan

A full visual rebuild of ArbFlow: landing, every page in the nav, and the whole
workspace. Tech choices and their rationale live in `DECISIONS.md`.

**Sequencing principle:** foundation first. Converting 18 pages ad hoc produces
18 slightly different designs; building the design system first means each page
conversion is small, consistent, and reviewable.

**Ground rules for every phase**
- Small commits, each one green (`tsc`, `lint`, `build`).
- Both themes verified — light *and* dark — before a page is called done.
- Reduced-motion honoured via the existing `useReducedMotionSafe` hook.
- Contrast checked on rendered pages, not by reading class names.
- No page ships half-converted: a page is either old or new, never both.

---

## The design language

Concrete decisions so "modernise it" doesn't drift into taste-by-committee.

**Floating pill navigation.** The marketing nav detaches from the top edge and
becomes a centred, rounded, glass pill that shrinks as you scroll — the active
link marked by a `layoutId` pill that slides between items rather than
appearing. On mobile it collapses to a bottom-anchored pill (thumb-reachable)
instead of a hamburger sheet.

**Dynamic-Island status surface.** The workspace gets a compact pill in the top
chrome that *morphs* to carry transient state instead of stacking banners:
idle it shows the workspace name; syncing it widens into a progress state;
an anomaly expands it into an alert with an action; connecting an integration
shows step progress. One element, animated between shapes with Framer's layout
animation — replacing today's separate toast, demo banner and anomaly banner,
which currently stack up and push the page around.

**Where your users are — world/country map.** A choropleth in the Audience
section: countries shaded by share of visitors, hover for a themed tooltip,
click to filter. Drills from world → country → region when GA4 has city data.
Rendered as our own SVG (see `DECISIONS.md`) so it themes with everything else.
Falls back to the existing ranked bar list when geography data is missing.

**Glass, used sparingly.** Chrome, overlays and floating panels only — sidebar,
nav pill, dialogs, dropdowns, the status island. Content cards stay opaque:
blurring everything is what makes glass UIs look muddy and unreadable.

**Depth over borders.** A real elevation scale (resting / raised / overlay)
replaces today's near-uniform 1px borders, so hierarchy reads without lines.

**Motion with intent.** Entrances stagger along the reading order; numbers
count up; charts draw in; hovers lift ~2px; presses scale to 0.98. Everything
gated on reduced motion.

**Other pieces in the same spirit:** bento-grid dashboard layout, animated
number counters on KPIs, sparkline-in-card hover detail, skeleton loaders
matching final layout (not spinners), command palette (⌘K) for navigation,
scroll-linked progress on long pages, and empty states that teach rather than
apologise.

---

## Phase 0 — Design foundation
The vocabulary everything else is written in.
- Dependencies: Radix primitives, `cva`, `tailwind-merge`, `clsx`, `lucide-react`, `sonner`.
- `cn()` helper; `components/ui/` directory established.
- **Token layer v2:** elevation/shadow scale, radius scale, glass tokens
  (`--glass-bg`, `--glass-border`, `--glass-blur`), spacing rhythm — all
  theme-aware, extending the existing `--ink`/`--surface`/`--line` set.
- **Motion vocabulary:** shared easings, durations and variants
  (`fadeUp`, `stagger`, `scaleIn`) so animation feels like one system.
- Primitives: Button, Card, Input/Label/Field, Badge, Tabs, Dialog, Tooltip,
  Switch, Skeleton, Toast.
- **`/design`** — a living reference route showing every primitive and variant
  in whichever theme you're viewing. Kept as a real route so it can't drift
  from the components it documents.

## Phase 1 — App shell
The frame every workspace page sits in.
- Sidebar: glass surface, `layoutId` active indicator, collapsible to icons.
- Mobile drawer rebuilt on Radix Dialog (focus trap + dismiss for free).
- Topbar with the **Dynamic-Island status pill**, breadcrumbs, workspace
  switcher, theme control and account menu.
- Reusable `PageHeader` (title, description, actions) so pages stop
  hand-rolling their own headers.
- **Command palette (⌘K)** for cross-page navigation and actions.

## Phase 2 — Workspace core (dashboard)
The page users actually live in.
- **Bento grid** layout: KPIs, trend, geography and channels in one composed
  board instead of stacked full-width rows.
- KPI cards → primitive-based, with **animated count-up** and skeletons that
  match the final layout.
- Themed chart wrappers around recharts (tooltips, grids, axes on tokens),
  with draw-in animation.
- **The world map** lands here, in Audience: choropleth of visitors by country,
  themed tooltip, click-to-filter, bar-list fallback.
- Section tabs, source switcher, property picker on the new primitives.
- Demo/empty/error states unified into one component — and folded into the
  status island rather than stacking banners.

## Phase 3 — Workspace secondary
Campaigns, Reports, Team, Billing, Integrations, Settings.
- One page per commit (or a few), each fully converted.
- Tables → the shared `DataTable` (built in Phase 2 — sorting, `aria-sort`,
  right-aligned numerics, its own horizontal scroll container).
- Settings tabs → Radix Tabs; forms → Input/Label/Switch primitives; native
  `<select>`s → the `Select` primitive.
- Replaces the ad-hoc toast with `sonner`.

## Phase 4 — Auth pages
Login, register, verify, forgot/reset, accept-invite.
- One shared `AuthCard` layout instead of five near-copies.
- Proper field validation states, loading buttons, and error surfaces.

## Phase 5 — Marketing
Landing, pricing, about, legal.
- **Floating pill navbar** with scroll-shrink and a sliding active indicator;
  bottom pill on mobile.
- Hero, feature sections and social proof rebuilt on the new system.
- Scroll-driven choreography (kept subtle, and disabled under reduced motion).
- A live product preview in the hero — the real dashboard components at rest,
  not a screenshot.
- Pricing on the primitives, with a monthly/annual switch; legal pages on a
  shared prose layout.

## Phase 6 — Motion & polish
- Route transitions; shared-element continuity where it aids orientation.
- Hover/press micro-interactions standardised via Button/Card variants.
- Full reduced-motion pass: every new animation gated.

## Phase 7 — Quality gate
- Contrast audit of every page in both themes.
- Mobile widths (390px) and real-engine checks (WebKit, Firefox).
- Bundle budget: the overhaul must not regress the dashboard's JS weight —
  measured, not assumed.
- Lighthouse pass on landing and dashboard.

---

## Status

- [x] **Phase 0** — foundation (tokens, motion, primitives, `/design`) ✅ *verified in both themes*
- [x] **Phase 1** — app shell (glass rail, status island, Cmd-K) ✅ *verified signed-in*
      — topbar breadcrumbs + account menu were missed at the time and landed
      during Phase 2. The workspace switcher and theme control live in the rail
      rather than the topbar, deliberately.
- [x] **Phase 2** — workspace core (bento board, themed charts, the world map,
      count-up KPIs, skeletons, one connection state in the island)
      ✅ *verified signed-in, both themes, 1440 + 390, and under reduced motion*
- [x] **Phase 3** — workspace secondary (Integrations, Campaigns, Reports,
      Team, Billing, Settings — all six converted; `sonner` replaces the
      bespoke toasts) ✅ *verified signed-in, both themes, 1440 + 390*
      — the conversions removed four pieces of fabricated UI: Settings'
      "Enterprise plan" with a saved VISA card, Settings' invented API keys,
      Reports' four made-up report rows, and Campaigns' Pause/Delete controls
      for GA4 traffic sources that nothing can pause or delete.
- [ ] **Phase 4 — auth** ← next
- [ ] Phase 5 — marketing
- [ ] Phase 6 — motion & polish
- [ ] Phase 7 — quality gate
