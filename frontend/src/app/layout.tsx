import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { themeScript } from "../lib/theme";
import { Toaster } from "../components/ui/toaster";
import { TooltipProvider } from "../components/ui/tooltip";
import { MotionProvider } from "../components/motion/MotionProvider";

// Type v2 (Part II, Phase 7). Geist carries UI, body and display; Geist Mono
// every number and label (tabular); Instrument Serif italic is the accent voice,
// at most one phrase per heading.
//
// Trimmed in Phase 12 for LCP on slow connections: Caveat had no users left
// but was still preloaded in three weights; the serif is only ever italic; and
// mono is small, used for labels, and needn't compete with Geist for the
// first bytes — it isn't preloaded.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", preload: false });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic", variable: "--font-instrument-serif" });

const DESCRIPTION =
  "One calm, white-labeled analytics workspace per client — and a plain-English sentence when something changes.";

export const metadata: Metadata = {
  // The tab and every shared link used to say "Multi-Tenant Analytics SaaS".
  title: { default: "ArbFlow — client analytics for agencies", template: "%s · ArbFlow" },
  description: DESCRIPTION,
  applicationName: "ArbFlow",
  openGraph: {
    type: "website",
    siteName: "ArbFlow",
    title: "ArbFlow — client analytics for agencies",
    description: DESCRIPTION,
  },
  twitter: { card: "summary", title: "ArbFlow — client analytics for agencies", description: DESCRIPTION },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs before first paint so dark-mode users never see a white flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geist.variable} ${geistMono.variable} ${serif.variable} font-sans bg-[var(--page)] text-[var(--ink)] antialiased`}
      >
        <MotionProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </MotionProvider>
        <Toaster />
      </body>
    </html>
  );
}
