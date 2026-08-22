// Theme handling. Three states are stored: "light", "dark", or absent =
// follow the OS. Absent is the default, so a first-time visitor gets whatever
// their system is set to.

export type Theme = "light" | "dark" | "system";

export const THEME_KEY = "arbflow_theme";

/** Inlined into <head> and run before first paint — without it a dark-mode
 *  user gets a white flash on every page load. Kept tiny and dependency-free
 *  on purpose; it must not throw in private mode where storage can be blocked. */
export const themeScript = `(function(){try{var s=localStorage.getItem("${THEME_KEY}");var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "dark" || v === "light" ? v : "system";
  } catch {
    return "system";
  }
}

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Apply a theme choice: paint it, and persist it (or clear it for "system"). */
export function applyTheme(theme: Theme): void {
  const dark = theme === "dark" || (theme === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
  try {
    if (theme === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* storage blocked — the class is still applied for this page */
  }
}
