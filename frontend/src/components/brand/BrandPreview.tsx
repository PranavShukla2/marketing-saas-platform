"use client";

import { cn } from "../../lib/cn";

/**
 * A client report as the agency's client receives it — logo, title in the
 * agency's accent, the client workspace, the traffic table with an accent
 * header, and the agency's footer. Mirrors what the PDF export in the
 * dashboard actually produces, so what an agency sees here is what it sends.
 *
 * Shared by the landing page's "Your brand" act and Settings → Branding.
 */

export type BrandPreviewProps = {
  accent: string;
  agencyName: string;
  logoUrl?: string | null;
  footer?: string | null;
  client?: string;
  rows?: { source: string; users: number; views: number }[];
  className?: string;
};

const SAMPLE_ROWS = [
  { source: "Google", users: 14820, views: 46180 },
  { source: "Direct", users: 6240, views: 17710 },
  { source: "Newsletter", users: 2915, views: 9860 },
  { source: "LinkedIn", users: 1870, views: 4120 },
];

/** Ink or white, whichever reads on the accent — WCAG relative luminance. */
export function onAccent(hex: string): string {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return "#ffffff";
  const lin = (c: string) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin(m[1]) + 0.7152 * lin(m[2]) + 0.0722 * lin(m[3]);
  // White wins while it has at least as much contrast as near-black does.
  return (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.05) ? "#ffffff" : "#0b1020";
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "A";
}

const nf = new Intl.NumberFormat("en-US");

export default function BrandPreview({
  accent,
  agencyName,
  logoUrl,
  footer,
  client = "Northwind Co.",
  rows = SAMPLE_ROWS,
  className,
}: BrandPreviewProps) {
  const fg = onAccent(accent);
  return (
    <div
      className={cn(
        // The frame is the size container, so the page's type scales with it.
        "relative aspect-[1/1.2] w-full overflow-hidden rounded-[var(--radius-md)] bg-white text-[#0b1020] shadow-[var(--shadow-overlay)] ring-1 ring-black/5 [container-type:inline-size]",
        className
      )}
      role="img"
      aria-label={`Sample client report for ${client}, branded for ${agencyName}`}
    >
      <div className="flex h-full flex-col p-[7%] text-[clamp(9px,3.4cqw,14px)]">
        <div className="flex items-center justify-between gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- an agency-supplied data/remote URL
            <img src={logoUrl} alt="" className="h-[2.6em] w-auto max-w-[40%] object-contain" />
          ) : (
            <span
              className="flex size-[2.6em] items-center justify-center rounded-[0.5em] font-semibold transition-colors duration-[var(--dur-step)]"
              style={{ background: accent, color: fg }}
            >
              {initials(agencyName)}
            </span>
          )}
          <span className="truncate text-[0.85em] text-[#5f6782]">{agencyName}</span>
        </div>

        <p className="mt-[8%] text-[1.9em] font-semibold leading-tight tracking-[-0.02em] transition-colors duration-[var(--dur-step)]" style={{ color: accent }}>
          Agency Performance Report
        </p>
        <p className="mt-[0.6em] text-[#5f6782]">Client workspace: {client}</p>
        <p className="text-[#5f6782]">Generated: 1 Dec 2026</p>

        <table className="mt-[7%] w-full border-collapse text-left">
          <thead>
            <tr className="transition-colors duration-[var(--dur-step)]" style={{ background: accent, color: fg }}>
              {["Source", "Users", "Views"].map((h, i) => (
                <th key={h} className={cn("border border-black/10 px-[0.8em] py-[0.55em] font-semibold", i > 0 && "text-right")}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.source}>
                <td className="border border-black/10 px-[0.8em] py-[0.55em]">{r.source}</td>
                <td className="border border-black/10 px-[0.8em] py-[0.55em] text-right tabular-nums">{nf.format(r.users)}</td>
                <td className="border border-black/10 px-[0.8em] py-[0.55em] text-right tabular-nums">{nf.format(r.views)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-auto border-t border-black/10 pt-[0.8em] text-[0.8em] text-[#8a90a6]">
          {footer || `Prepared by ${agencyName}`}
        </p>
      </div>
    </div>
  );
}
