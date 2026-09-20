"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, type InputProps } from "../ui";
import { cn } from "../../lib/cn";

/**
 * A password field with a reveal toggle.
 *
 * Three pages had their own copy, each with the two eye icons pasted in as raw
 * SVG paths. Two of them also forgot `aria-label` on the toggle, so a screen
 * reader announced an unlabelled button next to the password box.
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, Omit<InputProps, "type">>(
  ({ className, ...props }, ref) => {
    const [shown, setShown] = React.useState(false);
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={shown ? "text" : "password"}
          className={cn("pr-11", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          // tabIndex 0 by default, but it must not be reachable *before* the
          // field it belongs to, hence its position in the DOM.
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 rounded text-[var(--ink-3)] outline-none",
            "transition-colors hover:text-[var(--ink-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          )}
        >
          {shown ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
