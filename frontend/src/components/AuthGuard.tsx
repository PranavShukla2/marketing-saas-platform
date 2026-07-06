"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { consumeAuthCode, fetchSession } from "../lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Google OAuth sign-in lands here with a one-time ?auth_code=. Exchange
      // it before rendering children so the protected page never mounts (and
      // wipes the URL) until the session cookie is set.
      if (await consumeAuthCode()) {
        if (!cancelled) setIsAuthenticated(true);
        return;
      }

      // The session lives in an httpOnly cookie JS can't read, so ask the
      // backend whether we're signed in.
      const authed = await fetchSession();
      if (cancelled) return;

      if (!authed) {
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

  // Anything other than a confirmed "yes" shows the spinner — rendering
  // children while isAuthenticated is false would flash the protected page
  // for a beat before router.push("/login") lands.
  if (isAuthenticated !== true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
