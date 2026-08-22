"use client";

import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, systemPrefersDark, type Theme } from "../lib/theme";

const OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "M12 3v1.5M12 19.5V21M4.22 4.22l1.06 1.06M18.72 18.72l1.06 1.06M3 12h1.5M19.5 12H21M4.22 19.78l1.06-1.06M18.72 5.28l1.06-1.06M16 12a4 4 0 11-8 0 4 4 0 018 0z" },
  { value: "system", label: "System", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { value: "dark", label: "Dark", icon: "M21.75 15.5A9.75 9.75 0 018.5 2.25a9.75 9.75 0 1013.25 13.25z" },
];

/** Light / System / Dark segmented control. Defaults to System. */
export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getStoredTheme());
    setMounted(true);
  }, []);

  // While on "system", follow the OS if the user flips it mid-session.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => document.documentElement.classList.toggle("dark", systemPrefersDark());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const choose = (t: Theme) => {
    setTheme(t);
    applyTheme(t);
  };

  // Render a neutral shell until mounted: the stored choice isn't known during
  // SSR, so highlighting one early would be a hydration mismatch.
  return (
    <div
      role="group"
      aria-label="Colour theme"
      className={`inline-flex items-center gap-0.5 rounded-full border border-[var(--line)] bg-[var(--surface)] ${compact ? "p-0.5" : "p-1"}`}
    >
      {OPTIONS.map((opt) => {
        const active = mounted && theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => choose(opt.value)}
            aria-label={`${opt.label} theme`}
            aria-pressed={active}
            title={`${opt.label} theme`}
            className={`rounded-full transition-colors ${compact ? "p-1.5" : "p-2"} ${
              active
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--page)]"
            }`}
          >
            <svg className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
