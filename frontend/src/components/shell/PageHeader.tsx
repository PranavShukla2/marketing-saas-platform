"use client";

import { motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { fadeUp } from "../../lib/motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";

/**
 * One header for every workspace page. Pages were each hand-rolling their own
 * title block with slightly different sizes and spacing, which is the main
 * reason the app read as several products stitched together.
 */
export function PageHeader({
  title, description, actions, badge, className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotionSafe();
  return (
    <motion.header
      variants={reduce ? undefined : fadeUp}
      initial={reduce ? undefined : "hidden"}
      animate={reduce ? undefined : "show"}
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8",
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.025em] text-[var(--ink)] truncate">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="mt-1.5 text-[var(--ink-2)] text-base sm:text-lg font-light">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </motion.header>
  );
}
