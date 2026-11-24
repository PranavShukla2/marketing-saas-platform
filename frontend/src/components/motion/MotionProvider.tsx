"use client";

import { MotionConfig } from "framer-motion";

/**
 * The reduced-motion safety net for every Framer animation in the app.
 *
 * `reducedMotion="user"` makes Framer read `prefers-reduced-motion` itself, on
 * the client, as each element mounts — and when it's set, every transform,
 * width/height and position animation jumps straight to its end state instead
 * of moving. Opacity still fades, which is the accepted reduced-motion
 * behaviour: a fade doesn't move anything across the screen.
 *
 * Component-level gating on `useReducedMotionSafe()` can't do this alone. That
 * hook is `false` on the first render so server and client markup match, and
 * Framer reads `initial` exactly once, at mount — so `initial={reduce ? false
 * : …}` always sees `false` and the entrance plays anyway. Gating still earns
 * its place for things evaluated later (hover, tap, a loop that should not run
 * at all, CSS classes), but entrances rely on this.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export default MotionProvider;
