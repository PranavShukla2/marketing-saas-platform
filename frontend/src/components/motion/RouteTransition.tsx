"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { DURATION, EASE_OUT } from "../../lib/motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";

/**
 * A short cross-fade between routes.
 *
 * Deliberately not AnimatePresence with an exit animation. Next's App Router
 * has already swapped the tree by the time a `template.tsx` re-mounts, so
 * there is no outgoing element left to animate — an exit would either never
 * play or would hold the old page on screen while the new one is ready.
 * An entrance alone is honest about what the router actually does, and it
 * carries the orientation cue anyway.
 *
 * Kept to ~200ms and 4px: a route change should feel settled, not staged.
 * Anything longer starts to read as latency, which is the opposite of polish.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotionSafe();

  if (reduce) return <>{children}</>;

  return (
    <motion.div
      // Keying on the path is what re-runs this per navigation rather than
      // once per mount.
      key={pathname}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base * 0.65, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

export default RouteTransition;
