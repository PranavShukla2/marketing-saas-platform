"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { DURATION, EASE_OUT } from "../../lib/motion";

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

/**
 * Whether the app has already painted a page in this tab. The entrance is for
 * moving *between* pages: on the first load it started the whole page at
 * opacity 0 in the server HTML, so nothing — not even the headline — could
 * paint until JavaScript had downloaded and hydrated. Lighthouse measured that
 * as 4.7–14 s of LCP "render delay" (Phase 12). Module state: false on the
 * server and for the first client render, so hydration matches; true after.
 */
let painted = false;

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [firstLoad] = React.useState(() => !painted);
  React.useEffect(() => {
    painted = true;
  }, []);

  // Always the same wrapper. Branching on reduced motion here swapped a div
  // for a fragment a frame after load, which remounted the entire page —
  // state, data and all — for reduced-motion users. MotionProvider already
  // makes the 4px settle instantly for them.
  return (
    <motion.div
      // Keying on the path is what re-runs this per navigation rather than
      // once per mount.
      key={pathname}
      initial={firstLoad ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base * 0.65, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

export default RouteTransition;
