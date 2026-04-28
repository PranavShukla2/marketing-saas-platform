import Navbar from "../../components/Navbar";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="pt-16">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
