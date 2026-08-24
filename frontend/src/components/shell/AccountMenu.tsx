"use client";

import * as React from "react";
import Link from "next/link";
import { CreditCard, LogOut, Settings, Users } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "../ui";
import { apiFetch, getApiUrl, logout } from "../../lib/auth";

type Account = { company_name?: string; email?: string };

/**
 * The account menu the shell plan called for.
 *
 * Log out lived only at the bottom of the rail, which is collapsed to icons or
 * behind a hamburger for most of the time — and there was nowhere at all that
 * showed *which account* you were signed in as. On a product where an agency
 * switches between client workspaces, that is the thing worth being sure of.
 */
export function AccountMenu() {
  const [account, setAccount] = React.useState<Account | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`${getApiUrl()}/api/v1/auth/me`);
        if (!res.ok) return;
        const me = await res.json();
        if (!cancelled) setAccount(me);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const name = account?.company_name || account?.email || "Account";
  const initial = name.trim().charAt(0).toUpperCase() || "A";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${name}`}
        className="flex size-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--indigo),var(--violet))] text-xs font-semibold text-white outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--page)]"
      >
        {initial}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <p className="truncate text-sm font-semibold text-[var(--ink)]">{account?.company_name || "Your workspace"}</p>
          {account?.email && <p className="truncate text-xs text-[var(--ink-3)]">{account.email}</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/settings"><Settings />Settings</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/team"><Users />Team</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/billing"><CreditCard />Billing</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          tone="danger"
          onSelect={async () => { await logout(); window.location.href = "/login"; }}
        >
          <LogOut />Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
