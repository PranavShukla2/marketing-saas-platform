import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Caveat } from "next/font/google";
import "./globals.css";
import { themeScript } from "../lib/theme";
import { Toaster } from "../components/ui/toaster";
import { TooltipProvider } from "../components/ui/tooltip";
import { MotionProvider } from "../components/motion/MotionProvider";

// Type v2 (Part II, Phase 7). Geist carries UI, body and display; Geist Mono
// every number and label (tabular); Instrument Serif italic is the accent voice,
// at most one phrase per heading. Caveat is kept only for Flo's own speech.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument-serif" });
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-hand" });

export const metadata: Metadata = {
  title: "Multi-Tenant Analytics SaaS",
  description: "Secure, scalable marketing dashboards for agencies.",
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
        className={`${geist.variable} ${geistMono.variable} ${serif.variable} ${caveat.variable} font-sans bg-[var(--page)] text-[var(--ink)] antialiased`}
      >
        <MotionProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </MotionProvider>
        <Toaster />
      </body>
    </html>
  );
}
