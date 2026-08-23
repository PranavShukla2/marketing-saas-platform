import { cn } from "../../lib/cn";

/**
 * Loading placeholder. Shaped like the content it replaces rather than a
 * centred spinner, so the layout doesn't jump when data lands.
 *
 * The shimmer is a CSS animation (not Framer) so it's covered by the
 * prefers-reduced-motion block in globals.css automatically.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-[var(--radius-md)] bg-[var(--line)]", className)}
      {...props}
    />
  );
}
