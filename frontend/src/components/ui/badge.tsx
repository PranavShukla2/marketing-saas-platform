import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-medium whitespace-nowrap rounded-full border",
  {
    variants: {
      // Every tone carries a dark counterpart: a solid -50 tint is legible on
      // its own but glares on a dark page.
      tone: {
        neutral: "bg-[var(--page)] text-[var(--ink-2)] border-[var(--line)]",
        accent: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/25",
        success: "bg-[var(--success)]/12 text-[var(--success)] border-[var(--success)]/25",
        warning: "bg-[var(--warning)]/12 text-[var(--warning)] border-[var(--warning)]/25",
        danger: "bg-[var(--danger)]/12 text-[var(--danger)] border-[var(--danger)]/25",
        info: "bg-[var(--info)]/12 text-[var(--info)] border-[var(--info)]/25",
      },
      size: { sm: "text-[10px] px-2 py-0.5", md: "text-xs px-2.5 py-1" },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  /** Small leading dot — useful for live/status badges. */
  dot?: boolean;
}

export function Badge({ className, tone, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export { badgeVariants };
