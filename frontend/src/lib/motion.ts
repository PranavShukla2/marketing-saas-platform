"use client";

import type { Transition, Variants } from "framer-motion";

/**
 * Shared motion vocabulary. Animation reads as one system only if every
 * component borrows from the same easings and durations, so pages import
 * these rather than inventing their own numbers.
 *
 * Nothing here checks reduced motion — components gate on
 * `useReducedMotionSafe()` at the call site, because whether an animation is
 * decorative or load-bearing is a per-component decision.
 */

/** Gentle deceleration — the house curve for entrances. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
/** Slight overshoot, for things that should feel physical (pills, toggles). */
export const EASE_SPRING: Transition = { type: "spring", stiffness: 380, damping: 30 };

export const DURATION = {
  fast: 0.18,   // hovers, presses
  base: 0.32,   // most entrances
  slow: 0.55,   // hero / large surfaces
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
