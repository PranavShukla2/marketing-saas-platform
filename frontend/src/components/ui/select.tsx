"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

/**
 * Radix Select, styled by us.
 *
 * A native `<select>` can't be styled past its border: the popup is drawn by
 * the OS, so on a dark page it opens as a white list with black text and
 * ignores the radius, elevation and focus tokens the rest of the app uses.
 * Radix renders a real listbox we own, and brings typeahead, roving focus and
 * the `aria-activedescendant` wiring that a hand-rolled dropdown always
 * forgets.
 */
export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;
export const SelectGroup = SelectPrimitive.Group;

export const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { size?: "sm" | "md" }
>(({ className, children, size = "md", ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--line)]",
      "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-rest)] transition-colors",
      "hover:border-[var(--ink-3)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
      "disabled:cursor-not-allowed disabled:opacity-60 data-[placeholder]:text-[var(--ink-3)]",
      size === "sm" ? "h-8 px-2.5 text-xs" : "h-10 px-3.5 text-sm",
      className
    )}
    {...props}
  >
    <span className="truncate">{children}</span>
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="size-4 shrink-0 text-[var(--ink-3)]" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={6}
      className={cn(
        // Glass, because this is a floating panel — the one place DECISIONS.md
        // says it belongs. The stronger variant: a listbox floats straight over
        // page content with nothing dimming it behind.
        // af-pop-origin, not af-pop: the latter is the centred-dialog keyframe
        // and carries a translate(-50%, -50%) that would shove a popper-
        // positioned panel off its trigger.
        "glass-strong af-pop-origin z-50 overflow-hidden rounded-[var(--radius-md)] shadow-[var(--shadow-overlay)]",
        // Never taller than the viewport, and never narrower than its trigger.
        "max-h-[min(24rem,var(--radix-select-content-available-height))]",
        "min-w-[var(--radix-select-trigger-width)]",
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2 rounded-[var(--radius-sm)] py-2 pl-8 pr-3",
      "text-sm text-[var(--ink)] outline-none",
      "data-[highlighted]:bg-[var(--accent)]/10 data-[highlighted]:text-[var(--ink)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemIndicator className="absolute left-2.5 flex items-center">
      <Check className="size-3.5 text-[var(--accent)]" />
    </SelectPrimitive.ItemIndicator>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

export const SelectLabel = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]", className)}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";
