"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { consumeAuthCode } from "../lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Google OAuth sign-in lands here with a one-time ?auth_code=. Exchange
      // it before rendering children so the protected page never mounts (and
      // wipes the URL) until we have a token.
      if (await consumeAuthCode()) {
        if (!cancelled) setIsAuthenticated(true);
        return;
      }

      const token = localStorage.getItem("token");
      if (cancelled) return;

      if (!token) {
        setIsAuthenticated(false);
        if (pathname !== "/login" && pathname !== "/register") {
          router.push("/login");
        }
      } else {
        setIsAuthenticated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
