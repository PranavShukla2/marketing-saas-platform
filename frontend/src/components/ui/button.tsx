"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const buttonVariants = cva(
  // Base: focus-visible ring uses the accent token so it's correct in both
  // themes; disabled state is uniform so callers never re-style it.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium " +
    "transition-[background,color,opacity,box-shadow,transform] duration-150 " +
    "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-[var(--page)] disabled:pointer-events-none disabled:opacity-50 " +
    "active:scale-[0.98] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Brand gradient — the single primary action on a view.
        primary:
          "text-white shadow-[var(--shadow-rest)] hover:shadow-[var(--shadow-raised)] " +
          "bg-[linear-gradient(100deg,var(--indigo),var(--violet))] hover:opacity-95",
        // Inverts with the theme: dark pill in light mode, light pill in dark.
        solid: "bg-[var(--ink)] text-[var(--page)] hover:opacity-90 shadow-[var(--shadow-rest)]",
        outline:
          "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] " +
          "hover:bg-[var(--page)] hover:border-[var(--ink-3)]",
        ghost: "text-[var(--ink-2)] hover:bg-[var(--page)] hover:text-[var(--ink)]",
        glass: "glass text-[var(--ink)] hover:brightness-105 shadow-[var(--shadow-rest)]",
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-[var(--shadow-rest)]",
        link: "text-[var(--accent)] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-[var(--radius-sm)] [&_svg]:size-3.5",
        md: "h-10 px-4 text-sm rounded-[var(--radius-md)] [&_svg]:size-4",
        lg: "h-12 px-6 text-base rounded-[var(--radius-lg)] [&_svg]:size-5",
        icon: "h-10 w-10 rounded-[var(--radius-md)] [&_svg]:size-4",
      },
      pill: { true: "rounded-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", pill: false },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as the child element (e.g. a Next <Link>) instead of a <button>. */
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, pill, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, pill }), className)}
        // A loading button must not be clickable, and must announce itself —
        // a spinner alone tells a screen reader nothing.
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <span
            aria-hidden="true"
            className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
          />
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
