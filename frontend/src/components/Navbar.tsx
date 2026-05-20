"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    router.push("/login");
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`w-full h-16 flex items-center justify-between px-6 md:px-10 fixed top-0 left-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-[0_1px_15px_rgba(0,0,0,0.04)]"
          : "bg-white/80 backdrop-blur-md border-b border-gray-100"
      }`}
    >

      {/* Logo */}
      <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => router.push("/")}>
        <motion.div whileHover={{ rotate: 8, scale: 1.1 }} transition={{ type: "spring", stiffness: 400 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#111827" />
            <path d="M9 20L15 13L21 20" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="15" cy="13" r="2.5" fill="#3B82F6" />
          </svg>
        </motion.div>
        <span className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-gray-700 transition-colors">
          ArbFlow<span className="text-blue-500">.</span>
        </span>
      </div>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-500">
        {[
          { label: "Home", href: "/" },
          { label: "Pricing", href: "/pricing" },
          { label: "Workspace", href: "/dashboard" },
          { label: "Integrations", href: "/integrations" },
          { label: "About", href: "/about" },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="relative hover:text-black transition-colors py-1 group">
            {link.label}
            <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300 rounded-full" />
          </Link>
        ))}
      </div>

      {/* Dynamic Auth Buttons */}
      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
          >
            Log Out
          </motion.button>
        ) : (
          <>
            <Link href="/login" className="hidden md:block text-sm font-medium text-gray-500 hover:text-black transition-colors">
              Sign In
            </Link>
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-black text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-gray-800 transition-colors shadow-sm"
              >
                Get Started
              </motion.button>
            </Link>
          </>
        )}
      </div>

    </motion.nav>
  );
}