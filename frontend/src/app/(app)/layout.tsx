import Sidebar from "../../components/Sidebar";
import AuthGuard from "../../components/AuthGuard";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <div className="flex bg-[#fafafa] min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 sm:p-10 transition-all">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
