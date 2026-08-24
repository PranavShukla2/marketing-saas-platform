"use client";

import * as React from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "../../lib/cn";

/**
 * Radix DropdownMenu, styled by us.
 *
 * The dependency was installed in Phase 0 and never wired up; the app has been
 * hand-rolling popovers with an outside-click listener, which is the version
 * that always forgets Escape, focus return, and arrow-key navigation.
 */
export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;

export const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(({ className, sideOffset = 8, align = "end", ...props }, ref) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        // glass-strong, not glass: a menu floats directly over page content with
        // nothing dimming it, and its own labels have to stay readable. Dialogs
        // keep plain glass because their backdrop already darkens what's behind.
        "glass-strong af-pop-origin z-50 min-w-[12rem] overflow-hidden rounded-[var(--radius-md)] p-1",
        "shadow-[var(--shadow-overlay)]",
        className
      )}
      {...props}
    />
  </DropdownPrimitive.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & { tone?: "default" | "danger" }
>(({ className, tone = "default", ...props }, ref) => (
  <DropdownPrimitive.Item
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm outline-none",
      "data-[highlighted]:bg-[var(--accent)]/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "[&_svg]:size-4 [&_svg]:shrink-0",
      tone === "danger"
        ? "text-red-600 dark:text-red-400 data-[highlighted]:bg-red-500/10"
        : "text-[var(--ink-2)] data-[highlighted]:text-[var(--ink)]",
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuLabel = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownPrimitive.Label ref={ref} className={cn("px-2.5 py-2", className)} {...props} />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownPrimitive.Separator ref={ref} className={cn("my-1 h-px bg-[var(--line)]", className)} {...props} />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";
