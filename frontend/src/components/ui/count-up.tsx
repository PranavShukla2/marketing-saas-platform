"use client";

import * as React from "react";
import { useInView } from "framer-motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";

/**
 * A number that counts up to its value.
 *
 * Deliberately not the landing page's `CountUp`: this one animates *between*
 * values, not just from zero. A dashboard number changes when the user syncs
 * or switches property, and re-running a 0 → 48,120 sweep on every refresh
 * reads as "we lost your data and found it again". Counting from the previous
 * figure shows the delta instead.
 *
 * Formatting is a prop rather than prefix/suffix/decimals flags because KPI
 * values are money, percentages and durations as well as counts, and passing
 * `Intl` through three booleans gets ugly fast.
 */
export function CountUp({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  duration = 0.9,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  /** Seconds. */
  duration?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotionSafe();

  // The figure currently painted, and the one we're travelling from. `from` is
  // a ref so retargeting mid-flight doesn't re-run the effect from scratch.
  const [shown, setShown] = React.useState(0);
  const from = React.useRef(0);

  React.useEffect(() => {
    // Under reduced motion the settled value is rendered directly (below), so
    // there's nothing to animate — just keep the origin honest in case the
    // preference is turned back off.
    if (reduce) { from.current = value; return; }
    if (!inView) return;

    const origin = from.current;
    const distance = value - origin;
    if (distance === 0) return;

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      // Cubic ease-out: quick off the mark, settles without a bounce.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(origin + distance * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduce, inView]);

  return (
    // Screen readers get the settled figure, not every intermediate frame.
    <span ref={ref} className={className} aria-label={format(value)}>
      <span aria-hidden="true" className="tabular-nums">{format(reduce ? value : shown)}</span>
    </span>
  );
}
