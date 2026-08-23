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

## Phase 0 — Design foundation
The vocabulary everything else is written in.
- Dependencies: Radix primitives, `cva`, `tailwind-merge`, `clsx`, `lucide-react`, `sonner`.
- `cn()` helper; `components/ui/` directory established.
- **Token layer v2:** elevation/shadow scale, radius scale, glass tokens
  (`--glass-bg`, `--glass-border`, `--glass-blur`), spacing rhythm — all
  theme-aware, extending the existing `--ink`/`--surface`/`--line` set.
- **Motion vocabulary:** shared easings, durations and variants
  (`fadeUp`, `stagger`, `scaleIn`) so animation feels like one system.
- Primitives: Button, Card, Input, Label, Badge, Tabs, Dialog, Tooltip,
  Select, Switch, Skeleton, Toast.

## Phase 1 — App shell
The frame every workspace page sits in.
- Sidebar: glass surface, animated active indicator (`layoutId`), collapsible.
- Mobile drawer rebuilt on Radix Dialog (focus trap + dismiss for free).
- Topbar: breadcrumbs, workspace switcher, theme control, account menu.
- Reusable `PageHeader` (title, description, actions) so pages stop
  hand-rolling their own headers.

## Phase 2 — Workspace core (dashboard)
The page users actually live in.
- KPI cards → primitive-based, with skeleton loading states.
- Themed chart wrappers around recharts (tooltips, grids, axes on tokens).
- Section tabs, source switcher, property picker on the new primitives.
- Empty/demo/error states as one consistent component.

## Phase 3 — Workspace secondary
Campaigns, Reports, Team, Billing, Integrations, Settings.
- One page per commit (or a few), each fully converted.
- Tables → a shared `DataTable` with sorting and empty states.
- Settings tabs → Radix Tabs; forms → Input/Label/Switch primitives.
- Replaces the ad-hoc toast with `sonner`.

## Phase 4 — Auth pages
Login, register, verify, forgot/reset, accept-invite.
- One shared `AuthCard` layout instead of five near-copies.
- Proper field validation states, loading buttons, and error surfaces.

## Phase 5 — Marketing
Landing, pricing, about, legal.
- Hero, feature sections and social proof rebuilt on the new system.
- Scroll-driven choreography (kept subtle, and disabled under reduced motion).
- Pricing on the primitives; legal pages on a shared prose layout.

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

- [x] **Phase 0** — foundation (tokens, motion, primitives)
- [ ] Phase 1 — app shell
- [ ] Phase 2 — workspace core
- [ ] Phase 3 — workspace secondary
- [ ] Phase 4 — auth
- [ ] Phase 5 — marketing
- [ ] Phase 6 — motion & polish
- [ ] Phase 7 — quality gate
