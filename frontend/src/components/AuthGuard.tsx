"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check local storage for the token
    const token = localStorage.getItem("token");
    if (!token) {
      if (pathname !== "/login" && pathname !== "/register") {
        router.push("/login");
      }
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  // If we haven't determined auth state yet, show nothing to prevent flashes of content
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
