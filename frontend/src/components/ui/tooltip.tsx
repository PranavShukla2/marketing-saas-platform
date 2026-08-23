"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../../lib/cn";

/** Wrap the app (or a subtree) once; Radix shares open/close timing between
 *  tooltips so moving along a toolbar doesn't re-trigger the delay each time. */
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "af-pop-origin z-50 max-w-xs px-2.5 py-1.5 text-xs font-medium",
        // Inverted surface: a tooltip should read as an overlay, not another card.
        "rounded-[var(--radius-sm)] bg-[var(--ink)] text-[var(--page)] shadow-[var(--shadow-overlay)]",
        className
      )}
      {...props}
    >
      {children}
      <TooltipPrimitive.Arrow className="fill-[var(--ink)]" width={10} height={5} />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";

/** Convenience wrapper for the common case. */
export function Hint({
  label, children, side = "top",
}: { label: string; children: React.ReactNode; side?: "top" | "right" | "bottom" | "left" }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
