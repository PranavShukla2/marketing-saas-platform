"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/**
 * Radix handles the parts that are easy to get wrong by hand: focus is trapped
 * while open and restored to the trigger on close, the page behind is inert to
 * screen readers, Escape and outside-click dismiss, and scroll is locked.
 *
 * Animation is CSS keyed off Radix's data-state rather than Framer, so
 * AnimatePresence doesn't have to fight Radix over unmount timing — and the
 * existing prefers-reduced-motion block disables it for free.
 */
export function DialogContent({
  className, children, showClose = true, ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { showClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          "af-overlay fixed inset-0 z-50 bg-[var(--ink)]/40 backdrop-blur-sm"
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
          "af-pop glass rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-overlay)] outline-none",
          className
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close
            aria-label="Close"
            className={cn(
              "absolute right-4 top-4 rounded-full p-1.5 text-[var(--ink-3)] transition-colors",
              "hover:bg-[var(--page)] hover:text-[var(--ink)] outline-none",
              "focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            )}
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-5 pr-8", className)} {...props} />;
}

export const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold tracking-[-0.01em] text-[var(--ink)]", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-[var(--ink-2)] mt-1.5", className)} {...props} />
));
DialogDescription.displayName = "DialogDescription";

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2", className)} {...props} />;
}
