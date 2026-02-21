"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Re-check authentication status every time the user changes pages
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, [pathname]);

  const handleLogout = () => {
    // 1. Shred the VIP pass
    localStorage.removeItem("token");
    // 2. Update the UI
    setIsAuthenticated(false);
    // 3. Kick them out to the login page
    router.push("/login");
  };

  return (
    <nav className="w-full h-16 flex items-center justify-between px-6 md:px-10 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      
      {/* Logo */}
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push("/")}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="#111827"/>
          <path d="M9 20L15 13L21 20" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="15" cy="13" r="2.5" fill="#3B82F6"/>
        </svg>
        <span className="text-xl font-bold tracking-tight text-gray-900">
          ArbFlow<span className="text-blue-500">.</span>
        </span>
      </div>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-500">
        <Link href="/" className="hover:text-black transition-colors">Home</Link>
        <Link href="/pricing" className="hover:text-black transition-colors">Pricing</Link>
        <Link href="/dashboard" className="hover:text-black transition-colors">Workspace</Link>
        <Link href="/integrations" className="hover:text-black transition-colors">Integrations</Link>
        <Link href="/settings" className="hover:text-black transition-colors">Settings</Link>
      </div>

      {/* Dynamic Auth Buttons */}
      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <button 
            onClick={handleLogout}
            className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
          >
            Log Out
          </button>
        ) : (
          <>
            <Link href="/login" className="hidden md:block text-sm font-medium text-gray-500 hover:text-black transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="bg-black text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-gray-800 transition-colors">
              Get Started
            </Link>
          </>
        )}
      </div>

    </nav>
  );
}