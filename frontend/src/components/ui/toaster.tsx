"use client";

import { Toaster as Sonner } from "sonner";
import { useEffect, useState } from "react";

/**
 * Sonner, themed through our tokens.
 *
 * Sonner wants a "light" | "dark" | "system" theme prop. We can't read that
 * during SSR (the choice lives in localStorage / the OS), so we observe the
 * .dark class the theme script already put on <html> — one source of truth
 * rather than a second theme system that could disagree with the first.
 */
export function Toaster() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const read = () => setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "glass !rounded-[var(--radius-lg)] !shadow-[var(--shadow-overlay)] !text-[var(--ink)] !border-[var(--glass-border)]",
          description: "!text-[var(--ink-2)]",
          actionButton: "!bg-[var(--accent)] !text-white",
          cancelButton: "!bg-[var(--page)] !text-[var(--ink-2)]",
        },
      }}
    />
  );
}
