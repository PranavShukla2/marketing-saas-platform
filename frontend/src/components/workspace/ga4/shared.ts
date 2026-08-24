import type { WorkspaceData } from "../../../lib/demoData";

/**
 * What the dashboard actually renders: the demo dataset's shape (which mirrors
 * `/analytics/dashboard` exactly) plus the fields only a live response carries.
 *
 * Typed rather than `any` because the sections read a dozen collections each,
 * and every one of them was previously a silent `view.foo?.bar` that would
 * render blank instead of failing if the backend renamed a key.
 */
export type Ga4View = WorkspaceData & {
  message?: string;
  /** ISO timestamp; present when the payload came from the backend's cache. */
  cached_at?: string;
  anomaly?: { is_anomaly: boolean; message?: string };
};

export function fmtNum(v: string | number | undefined): string {
  const n = typeof v === "string" ? parseFloat(v) : v ?? 0;
  if (Number.isNaN(n)) return String(v ?? "0");
  return Math.round(n).toLocaleString();
}

export function toNum(v: string | number | undefined): number {
  const n = typeof v === "string" ? parseFloat(v) : v ?? 0;
  return Number.isNaN(n) ? 0 : n;
}

export function fmtMoney(v: string | number | undefined): string {
  return "$" + Math.round(toNum(v)).toLocaleString();
}

/**
 * Week-over-week change, as a percentage.
 *
 * Needs a full fortnight: comparing a partial week against a complete one
 * reports a collapse that never happened, which is exactly the sort of false
 * alarm that trains people to ignore the deltas.
 */
export function delta(series: number[]): number | undefined {
  if (!series || series.length < 14) return undefined;
  const n = 7;
  const last = series.slice(-n).reduce((a, b) => a + b, 0);
  const prev = series.slice(-2 * n, -n).reduce((a, b) => a + b, 0);
  if (!prev) return undefined;
  return Math.round(((last - prev) / prev) * 100);
}

/** "Updated 4 minutes ago" — the payload's age, in plain words. */
export function freshness(cachedAt: string | undefined): string | null {
  if (!cachedAt) return null;
  const then = new Date(cachedAt).getTime();
  if (Number.isNaN(then)) return null;
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "Updated just now";
  if (mins === 1) return "Updated 1 minute ago";
  if (mins < 60) return `Updated ${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  return hours === 1 ? "Updated 1 hour ago" : `Updated ${hours} hours ago`;
}

export const GA4_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "audience", label: "Audience" },
  { id: "acquisition", label: "Acquisition" },
  { id: "behavior", label: "Behavior" },
  { id: "conversions", label: "Conversions" },
] as const;

export type Ga4SectionId = (typeof GA4_SECTIONS)[number]["id"];
