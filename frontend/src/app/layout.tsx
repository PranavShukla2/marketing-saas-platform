import type { Metadata } from "next";
import { Inter, Caveat } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
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
    <html lang="en">
      <body className={`${inter.className} ${caveat.variable} bg-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
