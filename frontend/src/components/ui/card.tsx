"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const cardVariants = cva(
  "rounded-[var(--radius-lg)] transition-[box-shadow,transform,border-color] duration-200",
  {
    variants: {
      variant: {
        // Content surfaces stay opaque on purpose — blurring cards as well as
        // chrome is what makes glass UIs unreadable (see DECISIONS.md).
        solid: "bg-[var(--surface)] border border-[var(--line)] shadow-[var(--shadow-rest)]",
        glass: "glass shadow-[var(--shadow-rest)]",
        // No fill: for grouping inside an already-elevated surface.
        plain: "bg-transparent border border-[var(--line)]",
        // Draws the eye to one card in a grid without shouting.
        feature:
          "bg-[var(--surface)] border border-[var(--accent)]/30 shadow-[var(--shadow-raised)] " +
          "ring-1 ring-[var(--accent)]/10",
      },
      interactive: {
        true: "hover:shadow-[var(--shadow-raised)] hover:-translate-y-0.5 cursor-pointer",
        false: "",
      },
      padding: { none: "p-0", sm: "p-4", md: "p-5 sm:p-6", lg: "p-6 sm:p-8" },
    },
    defaultVariants: { variant: "solid", interactive: false, padding: "md" },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, padding, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant, interactive, padding }), className)} {...props} />
  )
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-start justify-between gap-4 mb-4", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-base font-semibold text-[var(--ink)] tracking-[-0.01em]", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-xs text-[var(--ink-3)] mt-0.5", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("", className)} {...props} />
);
CardContent.displayName = "CardContent";

export { cardVariants };
