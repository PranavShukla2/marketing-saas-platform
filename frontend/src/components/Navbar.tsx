"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Flo from "./landing/Flo";
import { fetchSession, logout } from "../lib/auth";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Session is an httpOnly cookie — ask the backend instead of reading storage.
    let cancelled = false;
    fetchSession().then((ok) => {
      if (!cancelled) setIsAuthenticated(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
    router.push("/login");
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`w-full h-16 flex items-center justify-between px-6 md:px-10 fixed top-0 left-0 z-50 transition-all duration-500 backdrop-blur-xl ${
        scrolled
          ? "bg-[var(--page)]/80 border-b border-[var(--line)] shadow-[0_1px_15px_rgba(20,18,46,0.04)]"
          : "bg-[var(--page)]/60 border-b border-transparent"
      }`}
    >

      {/* Logo */}
      <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => router.push("/")}>
        <motion.div whileHover={{ rotate: 8, scale: 1.1 }} transition={{ type: "spring", stiffness: 400 }}>
          <Flo variant="mark" size={28} />
        </motion.div>
        <span className="text-xl font-bold tracking-tight text-[var(--ink)] group-hover:opacity-80 transition-opacity">
          ArbFlow<span className="text-[var(--indigo)]">.</span>
        </span>
      </div>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-[var(--ink-2)]">
        {[
          { label: "Home", href: "/" },
          { label: "Workspaces", href: "/dashboard" },
          { label: "Integrations", href: "/integrations" },
          { label: "Pricing", href: "/pricing" },
          { label: "About", href: "/about" },
          { label: "Sign in", href: "/login" },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="relative hover:text-[var(--ink)] transition-colors py-1 group">
            {link.label}
            <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-[var(--indigo)] group-hover:w-full transition-all duration-300 rounded-full" />
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
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[var(--ink)] text-white text-sm font-medium px-5 py-2 rounded-full hover:opacity-90 transition-opacity shadow-sm"
            >
              Start free
            </motion.button>
          </Link>
        )}
      </div>

    </motion.nav>
  );
}