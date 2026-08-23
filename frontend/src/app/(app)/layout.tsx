import AuthGuard from "../../components/AuthGuard";
import { AppShell } from "../../components/shell/AppShell";

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
