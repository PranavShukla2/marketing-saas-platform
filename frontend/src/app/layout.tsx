import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
// We use Inter font for that clean, modern Apple aesthetic
const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} bg-[#fafafa] antialiased pt-16`}>
        {/* The Navbar sits at the top of every page */}
        <Navbar />
        
        {/* 'children' is where your specific pages (Home, Pricing, Dashboard) inject themselves */}
        <main>{children}</main>
      </body>
    </html>
  );
}