"use client";

import type { Transition, Variants } from "framer-motion";

/**
 * Shared motion vocabulary. Animation reads as one system only if every
 * component borrows from the same easings and durations, so pages import
 * these rather than inventing their own numbers.
 *
 * Nothing here checks reduced motion. `MotionProvider` (root layout) makes
 * Framer settle every transform instantly when the user asks for less motion;
 * components additionally gate on `useReducedMotionSafe()` for what that can't
 * reach — hover/tap feedback, opacity-only loops, and CSS-class animation.
 */

/** Gentle deceleration — the house curve for entrances. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
/** Slight overshoot, for things that should feel physical (pills, toggles). */
export const EASE_SPRING: Transition = { type: "spring", stiffness: 380, damping: 30 };

/**
 * Motion scale v2, named for what the product does rather than how long it
 * takes. The CSS side lives in globals.css as `--dur-*`, with the same values.
 */
const SCALE = {
  hover: 0.12,  // colour/lift feedback under the pointer
  panel: 0.18,  // menus, popovers, a tab's content swapping
  step: 0.28,   // one step of a sequence; most entrances
  merge: 0.42,  // things combining — streams joining, cards assembling
  reveal: 0.62, // hero and large surfaces arriving
} as const;

export const DURATION = {
  ...SCALE,
  // Phase 0 names, kept as aliases so existing call sites move onto the v2
  // scale without being touched. Prefer the names above in new code.
  fast: SCALE.panel,
  base: SCALE.step,
  slow: SCALE.reveal,
} as const;

/** Rise-and-fade. The default entrance. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_OUT } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.base, ease: EASE_OUT } },
};

/** For cards and modals that should feel like they arrive, not slide. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  show: { opacity: 1, scale: 1, transition: { duration: DURATION.base, ease: EASE_OUT } },
};

/**
 * Parent wrapper that walks its children in along the reading order. Pair with
 * `fadeUp` on each child.
 */
export const stagger = (gap = 0.06, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

/** Standard interactive feedback: lift on hover, settle on press. */
export const lift = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.98 },
  transition: EASE_SPRING,
};
