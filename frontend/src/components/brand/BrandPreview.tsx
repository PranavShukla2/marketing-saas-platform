"use client";

import { cn } from "../../lib/cn";
import { accentOnPaper, initials, onAccent, validAccent } from "../../lib/report";

/**
 * The client report on screen — the same layout `downloadReportPdf` draws in
 * lib/report.ts: logo or initials, agency name, title in the agency's accent
 * (ink if the accent is too pale to read on paper), client and date, four
 * headline figures, the traffic table with an accent header, and the footer.
 * What an agency sees here is what its client receives.
 *
 * Shared by the landing's "Your brand" act, Settings → Branding and Reports.
 */

export type BrandPreviewProps = {
  accent: string;
  agencyName: string;
  logoUrl?: string | null;
  footer?: string | null;
  client?: string;
  generated?: string;
  kpis?: { label: string; value: string }[];
  rows?: { source: string; users: number; views: number }[];
  className?: string;
};

const SAMPLE_KPIS = [
  { label: "Active users", value: "39,156" },
  { label: "Sessions", value: "52,470" },
  { label: "Page views", value: "121,387" },
  { label: "Engagement", value: "68.4%" },
];

const SAMPLE_ROWS = [
  { source: "Google", users: 14820, views: 46180 },
  { source: "Direct", users: 6240, views: 17710 },
  { source: "Newsletter", users: 2915, views: 9860 },
  { source: "LinkedIn", users: 1870, views: 4120 },
];

const nf = new Intl.NumberFormat("en-US");

export { onAccent };

export default function BrandPreview({
  accent: rawAccent,
  agencyName,
  logoUrl,
  footer,
  client = "Northwind Co.",
  generated = "1 Dec 2026",
  kpis = SAMPLE_KPIS,
  rows = SAMPLE_ROWS,
  className,
}: BrandPreviewProps) {
  const accent = validAccent(rawAccent);
  const fg = onAccent(accent);
  return (
    <div
      className={cn(
        // The frame is the size container, so the page's type scales with it.
        "relative aspect-[1/1.41] w-full overflow-hidden rounded-[var(--radius-md)] bg-white text-[#0b1020] shadow-[var(--shadow-overlay)] ring-1 ring-black/5 [container-type:inline-size]",
        className
      )}
      role="img"
      aria-label={`Client report for ${client}, branded for ${agencyName}`}
    >
      <div className="flex h-full flex-col p-[7.6%] text-[clamp(8px,3.1cqw,13px)]">
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

        <p
          className="mt-[9%] text-[1.85em] font-semibold leading-tight tracking-[-0.02em] transition-colors duration-[var(--dur-step)]"
          style={{ color: accentOnPaper(accent) }}
        >
          Agency Performance Report
        </p>
        <p className="mt-[0.6em] text-[#5f6782]">Client workspace: {client}</p>
        <p className="text-[#5f6782]">Generated: {generated}</p>

        <div className="mt-[6%] grid grid-cols-4 gap-[2%]">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-[0.4em] border border-[#e4e7ee] px-[0.7em] py-[0.6em]">
              <p className="truncate text-[0.62em] uppercase tracking-[0.06em] text-[#5f6782]">{k.label}</p>
              <p className="mt-[0.2em] truncate text-[1.15em] font-semibold tabular-nums">{k.value}</p>
            </div>
          ))}
        </div>

        <table className="mt-[6%] w-full border-collapse text-left">
          <thead>
            <tr className="transition-colors duration-[var(--dur-step)]" style={{ background: accent, color: fg }}>
              {["Source", "Users", "Views"].map((h, i) => (
                <th key={h} className={cn("border border-[#e4e7ee] px-[0.8em] py-[0.5em] font-semibold", i > 0 && "text-right")}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.source}>
                <td className="border border-[#e4e7ee] px-[0.8em] py-[0.5em]">{r.source}</td>
                <td className="border border-[#e4e7ee] px-[0.8em] py-[0.5em] text-right tabular-nums">{nf.format(r.users)}</td>
                <td className="border border-[#e4e7ee] px-[0.8em] py-[0.5em] text-right tabular-nums">{nf.format(r.views)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-auto border-t border-[#e4e7ee] pt-[0.8em] text-[0.8em] text-[#626880]">
          {footer || `Prepared by ${agencyName}`}
        </p>
      </div>
    </div>
  );
}
