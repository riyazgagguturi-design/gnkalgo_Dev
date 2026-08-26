"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, clearTokens, getAccessToken } from "@/lib/api";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/subscribe", label: "Subscribe" },
  { href: "/orders", label: "Orders" },
  { href: "/strategies", label: "Strategies" },
  { href: "/signals", label: "AI Signals" },
  { href: "/webhooks", label: "Webhooks" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    api<{ is_admin?: boolean }>("/api/v1/auth/me", {}, true)
      .then((me) => setIsAdmin(Boolean(me.is_admin)))
      .catch(() => setIsAdmin(false));
  }, [router]);

  return (
    <div className="min-h-screen grid md:grid-cols-[240px_1fr]">
      <aside className="border-b md:border-b-0 md:border-r border-[#1d3542] bg-[#0d1b24]/80 p-5">
        <Logo href="/dashboard" size={36} />
        <p className="mt-1 text-xs text-slate-400">www.gnkalgo.com</p>
        <nav className="mt-8 flex md:flex-col gap-2 overflow-x-auto">
          {[...NAV, ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : [])].map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-[#123348] text-[#2ee6a6]" : "text-slate-300 hover:bg-[#123348]/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          className="mt-8 text-sm text-slate-400 hover:text-white"
          onClick={() => {
            clearTokens();
            router.replace("/login");
          }}
        >
          Sign out
        </button>
      </aside>
      <main className="p-6 md:p-10">{children}</main>
    </div>
  );
}
