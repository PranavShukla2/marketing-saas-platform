/**
 * The client report — one definition, rendered two ways.
 *
 * There used to be two PDF exports: the dashboard's (branded) and the Reports
 * page's, which ignored branding entirely and signed every PDF "ArbFlow
 * Intelligence Systems" — on a page promising "a branded performance report".
 * Now both buttons export the same `ReportModel` through `downloadReportPdf`,
 * and `BrandPreview` renders the same model on screen, so the preview, the
 * dashboard export and the Reports export can't drift apart.
 */

export type ReportModel = {
  agencyName: string;
  logoUrl?: string | null;
  accent: string;
  footer?: string | null;
  client: string;
  generated: string;
  kpis: { label: string; value: string }[];
  rows: { source: string; users: number; views: number }[];
};

const nf = new Intl.NumberFormat("en-US");
const DEFAULT_ACCENT = "#5b5bd6";

function luminance(hex: string): number | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  const lin = (c: string) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(m[1]) + 0.7152 * lin(m[2]) + 0.0722 * lin(m[3]);
}

/** Ink or white, whichever reads on the accent (table header, logo tile). */
export function onAccent(hex: string): string {
  const L = luminance(hex);
  if (L === null) return "#ffffff";
  return 1.05 / (L + 0.05) >= (L + 0.05) / 0.05 ? "#ffffff" : "#0b1020";
}

/**
 * The accent, if it can be read as large text on white paper (3:1);
 * otherwise ink. A pale brand colour still tints the table header — it just
 * doesn't get to make the title illegible.
 */
export function accentOnPaper(hex: string): string {
  const L = luminance(hex);
  if (L === null) return "#0b1020";
  return 1.05 / (L + 0.05) >= 3 ? hex : "#0b1020";
}

export function validAccent(hex: string | null | undefined): string {
  return hex && /^#[0-9a-f]{6}$/i.test(hex) ? hex : DEFAULT_ACCENT;
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "A";
}

type Summary = Record<string, string | number | undefined>;
type WorkspaceLike = {
  company_name?: string;
  summary?: Summary;
  post_level?: { source: string; users: number; views: number }[];
};
type BrandLike = { logo_url?: string | null; accent_color?: string | null; report_footer?: string | null; company_name?: string | null };

const num = (v: string | number | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) ? nf.format(n) : String(v ?? "—");
};

export function reportFromWorkspace(view: WorkspaceLike, brand: BrandLike, opts: { agencyName?: string; logoUrl?: string | null; generated?: Date } = {}): ReportModel {
  const s = view.summary ?? {};
  return {
    agencyName: opts.agencyName || brand.company_name || "Your agency",
    logoUrl: brand.logo_url || opts.logoUrl || null,
    accent: validAccent(brand.accent_color),
    // The same fallback the old export used, so nothing changes for agencies
    // that never set a footer.
    footer: brand.report_footer || "Generated with ArbFlow",
    client: view.company_name || "Client workspace",
    generated: (opts.generated ?? new Date()).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    kpis: [
      { label: "Active users", value: num(s.active_users) },
      { label: "Sessions", value: num(s.sessions) },
      { label: "Page views", value: num(s.page_views) },
      { label: "Engagement", value: String(s.engagement_rate ?? "—") },
    ],
    rows: (view.post_level ?? []).slice(0, 8),
  };
}

/** Render the model to an A4 PDF and download it. */
export async function downloadReportPdf(m: ReportModel, filename: string): Promise<void> {
  const doc = await buildReportPdf(m);
  doc.save(filename);
}

/** Render the model to an A4 PDF document (split out so it can be tested). */
export async function buildReportPdf(m: ReportModel) {
  // Loaded on click so the PDF toolchain never rides the initial bundle.
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 16;
  const fg = onAccent(m.accent);

  // Header: logo (or the agency's initials on its accent) and the agency name.
  let logoDrawn = false;
  if (m.logoUrl) {
    try {
      const p = doc.getImageProperties(m.logoUrl);
      const w = 34;
      const h = Math.min(18, (p.height * w) / p.width);
      doc.addImage(m.logoUrl, M, 14, (p.width * h) / p.height, h);
      logoDrawn = true;
    } catch {
      // An unreadable image falls back to initials rather than failing the export.
    }
  }
  if (!logoDrawn) {
    doc.setFillColor(m.accent);
    doc.roundedRect(M, 14, 14, 14, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(fg);
    doc.text(initials(m.agencyName), M + 7, 22.6, { align: "center" });
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#5f6782");
  doc.text(m.agencyName, W - M, 22, { align: "right" });

  // Title, client, date.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(accentOnPaper(m.accent));
  doc.text("Agency Performance Report", M, 46);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor("#5f6782");
  doc.text(`Client workspace: ${m.client}`, M, 54);
  doc.text(`Generated: ${m.generated}`, M, 59.5);

  // Headline figures.
  const gap = 4;
  const cw = (W - M * 2 - gap * 3) / 4;
  m.kpis.forEach((k, i) => {
    const x = M + i * (cw + gap);
    doc.setDrawColor("#e4e7ee");
    doc.roundedRect(x, 68, cw, 20, 2, 2, "S");
    doc.setFontSize(7.5);
    doc.setTextColor("#5f6782");
    doc.text(k.label.toUpperCase(), x + 4, 74.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor("#0b1020");
    doc.text(k.value, x + 4, 83.5);
    doc.setFont("helvetica", "normal");
  });

  // Traffic by source.
  autoTable(doc, {
    head: [["Source", "Users", "Views"]],
    body: m.rows.map((r) => [r.source, nf.format(r.users), nf.format(r.views)]),
    startY: 96,
    margin: { left: M, right: M },
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9.5, textColor: "#0b1020", lineColor: "#e4e7ee", cellPadding: 2.6 },
    headStyles: { fillColor: m.accent, textColor: fg, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    // columnStyles only reaches body cells; numeric headers align with their numbers.
    didParseCell: (c) => {
      if (c.section === "head" && c.column.index > 0) c.cell.styles.halign = "right";
    },
  });

  // Footer: the agency's line.
  doc.setDrawColor("#e4e7ee");
  doc.line(M, H - 16, W - M, H - 16);
  doc.setFontSize(8.5);
  doc.setTextColor("#626880"); // 5.5:1 on white — the old grey was 3.2:1
  doc.text(m.footer || "Generated with ArbFlow", M, H - 10);

  return doc;
}
