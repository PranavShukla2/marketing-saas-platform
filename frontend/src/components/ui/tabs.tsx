"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { EASE_SPRING } from "../../lib/motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";

/**
 * Radix Tabs with a sliding active marker.
 *
 * The marker is a shared `layoutId` element that only exists on the active
 * trigger — that's what makes Framer animate it *between* triggers instead of
 * cross-fading. Knowing which trigger is active therefore has to happen in
 * React, not CSS, so this wrapper tracks the value and hands it down by
 * context. (Radix exposes `data-state="active"` for styling, but a CSS-only
 * marker can't be a single shared element, so it can't slide.)
 */
type Ctx = { value?: string; group: string };
const TabsCtx = React.createContext<Ctx>({ group: "tabs" });

export function Tabs({
  value, defaultValue, onValueChange, group = "tabs", children, ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & { group?: string }) {
  // Support both controlled and uncontrolled use without forcing callers to
  // manage state just to get the animation.
  const [internal, setInternal] = React.useState(defaultValue);
  const active = value ?? internal;

  const handleChange = React.useCallback(
    (v: string) => {
      setInternal(v);
      onValueChange?.(v);
    },
    [onValueChange]
  );

  return (
    <TabsCtx.Provider value={{ value: active, group }}>
      <TabsPrimitive.Root value={value} defaultValue={defaultValue} onValueChange={handleChange} {...props}>
        {children}
      </TabsPrimitive.Root>
    </TabsCtx.Provider>
  );
}

export const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { variant?: "segmented" | "underline" }
>(({ className, variant = "segmented", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center",
      variant === "segmented"
        ? "gap-1 p-1 rounded-full bg-[var(--page)] border border-[var(--line)]"
        : "gap-6 border-b border-[var(--line)] w-full",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { variant?: "segmented" | "underline" }
>(({ className, children, variant = "segmented", value, ...props }, ref) => {
  const { value: active, group } = React.useContext(TabsCtx);
  const reduce = useReducedMotionSafe();
  const isActive = active === value;

  const marker = cn(
    "absolute inset-0",
    variant === "segmented"
      ? "rounded-full bg-[linear-gradient(100deg,var(--indigo),var(--violet))]"
      : "top-auto h-0.5 rounded-full bg-[var(--accent)]"
  );

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      className={cn(
        "relative outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        "rounded-full disabled:opacity-50 disabled:pointer-events-none",
        variant === "segmented"
          ? "px-4 py-2 text-sm font-medium data-[state=active]:text-white text-[var(--ink-2)]"
          : "pb-3 text-sm font-medium data-[state=active]:text-[var(--ink)] text-[var(--ink-2)]",
        className
      )}
      {...props}
    >
      {isActive &&
        (reduce ? (
          <span aria-hidden="true" className={marker} />
        ) : (
          <motion.span aria-hidden="true" layoutId={`${group}-active`} transition={EASE_SPRING} className={marker} />
        ))}
      <span className="relative z-10">{children}</span>
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("outline-none rounded-[var(--radius-md)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]", className)}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";
