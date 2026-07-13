import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="pt-16">
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}
