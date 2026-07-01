import Sidebar from "../../components/Sidebar";
import AuthGuard from "../../components/AuthGuard";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <div className="flex bg-[var(--page)] min-h-screen">
        <Sidebar />
        <main className="flex-1 lg:ml-64 px-4 pb-12 pt-20 sm:px-6 lg:px-10 lg:pt-10 transition-all">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
