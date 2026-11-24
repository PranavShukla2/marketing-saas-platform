# UI overhaul — phased plan

A full visual rebuild of ArbFlow: landing, every page in the nav, and the whole
workspace. Tech choices and their rationale live in `DECISIONS.md`.

**Part I (Phases 0–6)** builds the system: tokens, primitives, shell, every page
converted, motion discipline. **Part II (Phases 7–12)** gives it an identity —
the "Confluence" direction, drawn from the animated portfolio, Kleene and the
classic portfolio — and carries it through marketing, auth and the workspace.

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

---

# Part II — Identity: from polished to unmistakable

Phases 0–6 fixed the *structure*: one design system, shared primitives, honest
content, disciplined motion. They didn't give ArbFlow a face. Lavender,
stickers and hand-drawn arrows are pleasant, and they look like a hundred
template SaaS sites. Put the live site next to Kleene and the animated
portfolio and ArbFlow is the least memorable of the three, even though it's the
one that's a product.

Part II is a complete overhaul of the identity: landing, every marketing page,
auth, and the whole workspace. It doesn't rebuild the system Phases 0–6 built;
it re-skins and re-stages it. Most of it lands through tokens, and that's the
Phase 0 investment paying off.

## What we take from the references, and what we leave

| Reference | Take | Leave |
|---|---|---|
| **Animated portfolio** (`~/portfolio_animated`) | Story told in *acts* with a progress rail; italic serif accent words inside sans headlines; real product shown working, not described; ⌘K; theme switch as a View Transition reveal; the GPU-particle capability (R3F + GLSL) | The particle *name*, the laptop-OS zoom, the games: those are the portfolio's signatures, and reusing them makes ArbFlow look like a portfolio piece |
| **Kleene** (`~/Downloads/kleene`) | Rigour: a named motion scale (120/180/280/420/620ms), the real product live in the hero, "watch it happen" honesty, `Live` tags on what really works, mono numerals for facts | Its slate-and-indigo look: ArbFlow needs its own palette, not Kleene's |
| **Classic portfolio** (`~/Desktop/Portfolio`) | A mascot with real personality, used sparingly; one bold signature gradient | Gradient Candy pink: that's Pranav's personal brand, not the product's |

## The idea: Confluence

The name is *Flow*. The mascot is a *drop*. The product turns many streams into
one calm view. So the identity is water: every client's data arrives as separate
tributaries (GA4, Meta, LinkedIn), each turbulent and each its own colour.
ArbFlow is where they meet and run calm. The signature visual is that
confluence, and every section of the site is one stage of it.

This idea also gives the system **rules**, not just decoration:

- **Colour = source, everywhere.** GA4 is amber, Meta is azure, LinkedIn is
  teal: in the hero streams, chart series, integration cards, tags and PDF
  exports alike. Someone learns it once on the landing page and it pays off
  in the dashboard.
- **Violet = unified.** Once the streams merge they become Flo's violet. Violet
  marks ArbFlow's own combined view and the primary action, nothing else.
- **Coral = anomaly, and only anomaly.** It's the drop of red in the water. Today
  coral is spent on CTA gradients and stickers, which dilutes the one signal it
  should carry.
- **Calm is the product.** The motion budget is spent at the top. After the
  hero's turbulence, each section is calmer than the last: fewer moving things,
  more space.

## Visual language v2

**Type.** Geist for UI, body and display (tight tracking at display sizes).
Instrument Serif *italic* for accent words, at most one phrase per heading
("Three platforms. *One calm current.*"). Geist Mono for numbers, eyebrows and
labels, always tabular. Caveat leaves the marketing chrome and survives only as
Flo's own voice in speech bubbles. Stickers and hand-drawn arrows are retired.

**Palette: Tidewater.** Directional values; Phase 7 validates every pair for
contrast in both themes before anything ships.
- *Deep* (dark theme base, and the hero in both themes): `#070B16` → `#0E1424`
- *Paper* (light surfaces): a cool `#F7F8FB` in place of today's lavender
- *Unified*: Flo violet `#7C5CFF`
- *Sources*: GA4 amber `#F5A524`, Meta azure `#3D8BFF`, LinkedIn teal `#14B8A6`
- *Anomaly*: coral `#FF5A5F`

**Surfacing.** The hero is deep water in both themes. In light theme the page
background rises from deep to paper across the first scroll (scroll-linked), so
the visitor *surfaces* into the calm. In dark theme it stays deep.

**Motion scale v2**, named for what the product does. It replaces `DURATION`
in `lib/motion.ts`: `hover` 120ms, `panel` 180ms, `step` 280ms, `merge` 420ms,
`reveal` 620ms, with one house ease. Reduced motion is handled as Phase 6 set
it up (`MotionProvider`, `Reveal`, no branching entrances).

## Signature moments

**1. Hero: the Confluence.** A flow field across deep water: three particle
streams in source colours enter from the left and churn on curl noise, pinch
through a narrows at ~40% width, and leave as one calm violet line. That line
*is* a sparkline, with a value tag riding its tip. The pointer is a hand in the
water and stirs local turbulence. Flo sits on the line.
- *Poster first:* a static SVG render of the same scene is the first paint, the
  LCP stays text, and the scene hydrates after it.
- The poster is also the fallback for reduced motion, no WebGL, `saveData`,
  low `hardwareConcurrency`, and a hidden tab. The scene pauses off-screen and
  caps DPR at 1.5.
- R3F + GLSL vs. 2D canvas is decided by a Phase 7 spike on size and FPS, not
  by taste.

**2. The story, in acts.** A right-edge rail (`01 Sources … 06 Vault`) fills as
you read, and ⌘K jumps between acts. It replaces today's stack of loosely
related sections.
1. **Sources.** Three tributary cards (GA4, Meta, LinkedIn) showing the real
   connect states (connect → authorising → synced). The hero's streams run on
   into each card.
2. **Confluence.** Three real raw payload snippets (mono, the actual field
   names, timezones and currencies each API returns) morph into one normalised
   row. It shows what the backend genuinely does, which is the whole pitch.
3. **The calm view.** A pinned section where the real dashboard assembles from
   the stream, piece by piece: `KpiCard`, the trend, and the `GeoMap` (India
   drawn as India defines it). This evolves `PinnedShowcase` and uses real
   components on demo data.
4. **Ripples.** A drop falls onto the trend line, a ripple spreads from the
   point, and the plain-English alert writes itself beside it, anchored to that
   point: *"Sessions fell 31% on Tue 14: organic search, mostly /pricing."*
5. **Your brand.** Interactive: pick an accent and a logo mark, and the
   dashboard preview re-themes live through the **same `brand_settings` token
   pipeline the app uses**. One component, two homes (here and Settings →
   Branding).
6. **Vault.** Credential encryption made visible: an OAuth token scrambles into
   Fernet ciphertext, and each workspace runs in its own locked lane. The copy
   says exactly what is true (see Honesty below).
- **Finale.** The river runs into the CTA, and Flo waves.

**3. The theme switch is a tide.** A View Transitions circular reveal from the
toggle. Without the API it switches instantly.

**4. Flo grows up.** One consistent pose set (idle, guiding, celebrating,
worried) used for the guide, empty states and anomalies. Fewer appearances,
each meaning something.

## Honesty: fix these, not restyle them

Phases 3–5 removed fabricated UI. These survived and must go in Part II:
- **`StatsStrip`** claims "1,200+ workspaces", "4.2M+ data points", "99.9%
  uptime SLA" and "6 integrations": a beta with three integrations and no
  SLA. Replace with true, checkable facts (three sources, setup time measured
  end to end, per-workspace isolation) or cut it.
- **"AES-256"** appears in `BentoFeatures`, `FaqSection` and
  `PinnedShowcase`. Fernet is AES-128-CBC with HMAC-SHA256. `PinnedShowcase`
  also says "per tenant", but one `ENCRYPTION_KEY` encrypts every tenant. Say
  "Fernet (AES-128 + HMAC-SHA256), encrypted at rest" as the privacy page
  already does, or move to per-tenant keys before claiming them.
- Product visuals are real components on demo data. Where a number could be
  mistaken for a customer's, label it as a demo.

## The identity reaches the app

This is the "complete" in complete overhaul. Without it, the landing promises a
product the workspace doesn't look like.
- **Source colours** across every chart series, tag, integration card and
  report export.
- **Anomalies as ripples on the chart**, with the alert anchored to the data
  point, in place of banner-style alerts. The status island still carries
  global state.
- **Status island idle state:** a thin three-stream ribbon that pulses on sync.
- **Onboarding:** "Add your first tributary", a three-step connect flow. An
  empty workspace shows a dry-riverbed state that teaches what will appear,
  rather than apologising.
- **Settings → Branding** uses the Act 5 live re-theme component.
- **Auth pages:** a split layout with the Confluence scene at low intensity on
  one side (shared component, poster first).
- **About page** rebuilt on tokens. It still uses off-palette blues, and its
  `mailto:` link has no domain.

## Deliberately not doing

- **Smooth-scroll libraries (Lenis).** They fight native scrolling, sticky
  positioning and assistive tech, which is a poor trade for a SaaS site people
  return to.
- **3D device mockups.** The laptop is the portfolio's signature, and the phone
  mockup already exists.
- **Fake social proof.** No logo walls or testimonials until there are real
  ones.

## Phase 7 — Identity foundation
- Fonts via `next/font`: Geist, Geist Mono and Instrument Serif. First confirm
  the Next 16.3.5 Turbopack dev error on `next/font/google` (`queries have
  exactly one entry`) is resolved or worked around; production builds are
  unaffected.
- Tidewater tokens in both themes, contrast-validated on rendered pages.
  Semantic `--source-ga4/meta/linkedin`, `--unified` and `--anomaly` tokens.
- Motion scale v2 in `lib/motion.ts`; `/design` updated to show all of it.
- **Spike:** the Confluence scene in R3F+GLSL and in 2D canvas. Measure gzipped
  size (budget ≤ 70KB, lazy, after LCP) and FPS on a 4× CPU-throttled mid-tier
  profile, then pick one.

## Phase 8 — Hero: the Confluence
- Poster SVG, the scene, pointer turbulence, and every fallback path.
- LCP and CLS no worse than today's hero, measured.

## Phase 9 — The story
- Act rail and Acts 1–6 replace the current section stack. `InsightCards`,
  `Sticker`, `Annotation`, `StatsStrip` and `BentoFeatures` are retired or
  folded into the acts.
- The honesty fixes land here.
- Pricing, About and legal move onto v2.

## Phase 10 — Identity into the app
- Source colours, ripple anomalies, the island ribbon, onboarding, the shared
  branding live-preview, and the auth split layout.

## Phase 11 — LinkedIn and Reports to standard
- `LinkedInDashboard` rebuilt to the GA4/Meta standard, in source colours.
- Reports as a document-style builder with a live PDF preview that honours
  brand settings.

## Phase 12 — Quality gate
- Contrast audit of every page in both themes.
- Mobile widths (390px) and real-engine checks (WebKit, Firefox).
- Bundle budget: the overhaul must not regress the dashboard's JS weight —
  measured, not assumed. Landing JS budget set in Phase 7 and enforced.
- Lighthouse pass on landing and dashboard; ≥ 90 performance on a mid-tier
  mobile profile with the hero scene running.
- Reduced motion, no-WebGL and `saveData` paths each walked end to end.

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
- [x] **Phase 4** — auth (one `AuthCard`/`AuthResult` behind all six pages;
      shared `PasswordInput`, `GoogleButton` and API-error helpers; inline
      field validation) ✅ *verified in both themes at 1280 + 390, including
      every result state and both invalid-field paths*
- [x] **Phase 5** — marketing: floating nav pill (top on desktop, bottom on
      phones) with a sliding active indicator, pricing rebuilt on the
      primitives with the monthly/annual switch, legal pages on a shared prose
      layout with anchors ✅ *verified in both themes at 1280 + 390 and under
      reduced motion*
      — **deliberately not done:** the landing hero and feature sections were
      already rebuilt and polished in an earlier session, so they were left
      alone apart from the CTAs and one false claim. A wholesale re-do would
      have risked regression for no user-visible gain. The "live product
      preview in the hero" is also unbuilt — `PinnedShowcase` already renders
      real dashboard components further down the page, which covers the intent.
- [ ] **Phase 6 — motion & polish** ← in progress
      — done: route transitions (`template.tsx`); one gated `Reveal` that every
      hand-rolled scroll entrance now uses; a root `MotionProvider`
      (`reducedMotion="user"`) so Framer settles every transform itself under
      reduced motion; Button/Card press and lift respect reduced motion.
      ✅ *landing, pricing and about verified at 1440 + 390 under both motion
      settings*
      — the pass found two headers that were **invisible** under reduced
      motion: `PageHeader` (every workspace page title) and the pricing hero.
      Both swapped their Framer props to `undefined` once the hydration-safe
      hook resolved, a frame after mount, which froze the entrance at
      opacity 0. Entrances no longer branch on reduced motion at all.
      — left: shared-element continuity. (The about page's off-palette blues
      are now part of Phase 9.)

**Part II — identity**
- [x] **Phase 7 — identity foundation** ✅ *verified in both themes; contrast
      checked on 70 token pairs and live on `/design`*
      — Geist / Geist Mono / Instrument Serif wired (the landing's SF Pro
      override removed); Tidewater tokens with semantic source, unified and
      anomaly colours, old names aliased onto them; motion scale v2; `/design`
      shows all of it with contrast computed live.
      — **hero spike decided: raw WebGL2** (2.3 KB gzip, 2.4 ms/frame at 8k
      particles on a 4×-throttled CPU) over Canvas 2D (5.4 ms) and R3F
      (~251 KB). Evidence and Phase 8 notes in `DECISIONS.md`; the lab stays
      at `/design/confluence`.
      — the "Turbopack font error" was a stale `.next/dev` cache from the
      16.2 → 16.3 upgrade, not a Next bug: `rm -rf frontend/.next/dev`.
- [ ] Phase 8 — hero: the Confluence
- [ ] Phase 9 — the story in six acts, plus the honesty fixes
- [ ] Phase 10 — identity into the app
- [ ] Phase 11 — LinkedIn and Reports to standard
- [ ] Phase 12 — quality gate
