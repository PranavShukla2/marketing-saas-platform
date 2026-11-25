import type { Metadata } from "next";

// The page is a client component, which can't export metadata; this gives the
// tab its own title (the root template adds " · ArbFlow").
export const metadata: Metadata = { title: "Verify your email" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
