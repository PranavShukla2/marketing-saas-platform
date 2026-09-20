"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { DURATION, EASE_OUT } from "../../lib/motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";

type Direction = "up" | "down" | "left" | "right" | "none";

const OFFSET: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 20 },
  down: { y: -20 },
  left: { x: 20 },
  right: { x: -20 },
  none: {},
};

/**
 * "Fade in when it scrolls into view" — the single most repeated animation in
 * this codebase, and the one most often shipped without a reduced-motion gate.
 *
 * Twelve components had their own copy of the `initial`/`whileInView`/
 * `viewport` triple with hand-picked offsets and durations, and eight of them
 * animated regardless of the user's motion preference: `prefers-reduced-motion`
 * is honoured by the CSS in globals.css, but inline Framer props never reach
 * that media query, so each one has to check in JS. Centralising it means a
 * component can't forget.
 *
 * Under reduced motion this renders the element with no wrapper animation at
 * all — not a zero-duration animation, which still tells Framer to take over
 * the element's transform.
 */
export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = DURATION.slow,
  amount = 0.2,
  once = true,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  /** How much of the element must be visible before it plays. */
  amount?: number;
  once?: boolean;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const reduce = useReducedMotionSafe();
  const Motion = motion[Tag];

  if (reduce) return <Tag className={className}>{children}</Tag>;

  return (
    <Motion
      className={className}
      initial={{ opacity: 0, ...OFFSET[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: EASE_OUT }}
    >
      {children}
    </Motion>
  );
}

/**
 * Parent for a run of `Reveal`s that should walk in along the reading order.
 * Children opt in with `variants={revealChild}`.
 */
export function RevealGroup({
  children,
  gap = 0.08,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  gap?: number;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotionSafe();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  );
}

/** Child variant for `RevealGroup`. */
export const revealChild: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE_OUT } },
};

export default Reveal;
