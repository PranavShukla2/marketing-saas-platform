import NavPill from "../../components/marketing/NavPill";
import Footer from "../../components/Footer";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // bg-[var(--page)], not transparent: the wrapper's top padding is what
    // clears the floating pill, and without a background it exposed the body's
    // white straight above a --page hero as a hard horizontal seam.
    <div className="bg-[var(--page)] pt-20 sm:pt-24">
      <a href="#main" className="skip-link">Skip to content</a>
      <NavPill />
      <main id="main">{children}</main>
      <Footer />
      {/* Clearance for the bottom nav pill on phones. */}
      <div aria-hidden="true" className="h-20 sm:hidden" />
    </div>
  );
}
