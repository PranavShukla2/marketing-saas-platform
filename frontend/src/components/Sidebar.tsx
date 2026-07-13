"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getApiUrl, logout, apiFetch } from "../lib/auth";
import { withWorkspace, getActiveWorkspace, setActiveWorkspace } from "../lib/workspace";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { name: "Campaigns", href: "/campaigns", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
  { name: "Reports", href: "/reports", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { name: "Integrations", href: "/integrations", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
  { name: "Team", href: "/team", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { name: "Billing", href: "/billing", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { name: "Settings", href: "/settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
];

type Workspace = { id: number; name: string; role: string; is_own: boolean };

export default function Sidebar() {
  const pathname = usePathname();
  const [usage, setUsage] = useState({ current: 0, limit: 100000, percentage: 0 });
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWs, setActiveWs] = useState<string>("");

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Load the workspaces this user can view (own + teams they've joined).
  useEffect(() => {
    setActiveWs(getActiveWorkspace() || "");
    (async () => {
      try {
        const res = await apiFetch(`${getApiUrl()}/api/v1/workspace/workspaces`);
        if (res.ok) {
          const data = await res.json();
          const list: Workspace[] = data.workspaces || [];
          setWorkspaces(list);
          // If the stored workspace is no longer accessible, drop back to own.
          const current = getActiveWorkspace();
          if (current && !list.some((w) => String(w.id) === current && !w.is_own)) {
            setActiveWorkspace(null);
            setActiveWs("");
          }
        }
      } catch {}
    })();
  }, []);

  const switchWorkspace = (value: string) => {
    const own = workspaces.find((w) => w.is_own);
    setActiveWorkspace(value && (!own || String(own.id) !== value) ? value : null);
    // Hard reload so every page re-fetches against the new workspace.
    window.location.href = "/dashboard";
  };

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const backendUrl = getApiUrl();
        // Session rides in the httpOnly cookie — no header needed.
        const res = await apiFetch(withWorkspace(`${backendUrl}/api/v1/workspace/billing`));
        if (res.ok) {
          const data = await res.json();
          setUsage(data.usage);
        }
      } catch (err) {}
    };
    fetchBilling();
  }, [pathname]); // Refresh when path changes to sync with dashboard

  return (
    <>
    {/* Mobile top bar */}
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 z-40">
      <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-2 -ml-2 text-gray-600">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <Link href="/" className="flex items-center space-x-2">
        <svg width="26" height="26" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="10" fill="url(#arbflow-topbar-gradient)" /><path d="M9 21V16" stroke="white" strokeWidth="2.5" strokeLinecap="round" /><path d="M16 21V10" stroke="white" strokeWidth="2.5" strokeLinecap="round" /><path d="M23 21V13" stroke="white" strokeWidth="2.5" strokeLinecap="round" /><circle cx="16" cy="10" r="2.5" fill="white" /><defs><linearGradient id="arbflow-topbar-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop stopColor="#2563EB" /><stop offset="1" stopColor="#8B5CF6" /></linearGradient></defs></svg>
        <span className="text-lg font-semibold tracking-tight text-gray-900">ArbFlow</span>
      </Link>
      <span className="w-8" />
    </div>

    {/* Backdrop */}
    {open && <div onClick={() => setOpen(false)} className="lg:hidden fixed inset-0 bg-black/30 z-40" />}

    <div className={`w-64 h-screen bg-white/90 lg:bg-white/80 backdrop-blur-md border-r border-gray-100/80 fixed left-0 top-0 flex flex-col py-6 px-4 z-50 transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
      <Link href="/" className="flex items-center space-x-3 px-3 mb-12 hover:opacity-80 transition-opacity">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
          <rect width="32" height="32" rx="10" fill="url(#arbflow-sidebar-gradient)" />
          <path d="M9 21V16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M16 21V10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M23 21V13" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="16" cy="10" r="2.5" fill="white" />
          <defs>
            <linearGradient id="arbflow-sidebar-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2563EB" />
              <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
        <span className="text-xl font-semibold tracking-tight text-gray-900">ArbFlow</span>
      </Link>

      {/* Workspace switcher — shown only when the user belongs to a team. */}
      {workspaces.length > 1 && (
        <div className="px-1 mb-6">
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 px-2">Workspace</label>
          <select
            aria-label="Switch workspace"
            value={activeWs}
            onChange={(e) => switchWorkspace(e.target.value)}
            className="w-full text-sm font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.is_own ? "" : String(w.id)}>
                {w.name}{w.is_own ? " (You)" : ` · ${w.role}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link key={item.name} href={item.href}>
              <div className={`relative px-4 py-3 rounded-2xl flex items-center space-x-3 transition-colors ${isActive ? 'text-black' : 'text-gray-500 hover:text-gray-800'}`}>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-gray-100 rounded-2xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg>
                <span className="font-medium text-sm relative z-10">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4">
        <Link href="/billing">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-4 block cursor-pointer transition-transform hover:scale-[1.02]">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Workspace limit</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${usage.percentage}%` }}></div></div>
            <p className="text-xs text-gray-500">{Math.floor(usage.current).toLocaleString()} / {Math.floor(usage.limit / 1000)}k views</p>
          </div>
        </Link>
        
        <div onClick={async () => { await logout(); window.location.href = "/login"; }} className="flex items-center space-x-3 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors px-3 py-2 cursor-pointer">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          <span>Log out</span>
        </div>
      </div>
    </div>
    </>
  );
}
