"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "../../lib/cn";

/**
 * Replaces the decorative div-with-a-dot toggles the app used to have: this one
 * is a real switch — focusable, space/enter operable, and announced with its
 * on/off state.
 */
export const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
      "transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
      "focus-visible:ring-offset-[var(--page)] disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=unchecked]:bg-[var(--line)]",
      "data-[state=checked]:bg-[linear-gradient(100deg,var(--indigo),var(--violet))]",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block size-5 rounded-full bg-white shadow-[var(--shadow-rest)]",
        "transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";
