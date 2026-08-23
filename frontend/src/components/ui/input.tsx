"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "../../lib/cn";

export const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("text-sm font-medium text-[var(--ink-2)] select-none", className)}
    {...props}
  />
));
Label.displayName = "Label";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      // aria-invalid rather than colour alone: an error a screen reader can't
      // perceive isn't an error state.
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full h-11 px-4 text-sm rounded-[var(--radius-md)] bg-[var(--page)] text-[var(--ink)]",
        "border border-[var(--line)] outline-none transition-[border-color,box-shadow] duration-150",
        "placeholder:text-[var(--ink-3)]",
        "focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/25",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        invalid && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/25",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

/** Field wrapper: label, control, and an error that's wired up for assistive tech. */
export function Field({
  label, htmlFor, error, hint, children, className,
}: {
  label?: string; htmlFor?: string; error?: string; hint?: string;
  children: React.ReactNode; className?: string;
}) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && !error && <p className="text-xs text-[var(--ink-3)]">{hint}</p>}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
