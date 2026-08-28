"use client";

import { Logo } from "@/components/Logo";
import { MarketTicker } from "@/components/market/MarketTicker";
import { clearTokens } from "@/lib/api";
import { useRouter } from "next/navigation";

export function TradingHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--background)]">
      <div className="flex h-11 items-center justify-between gap-3 px-3 lg:px-4">
        <Logo href="/dashboard" size={32} variant="full" />
        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-[10px] text-[var(--muted)]">www.gnkalgo.com</span>
          <button
            type="button"
            onClick={() => {
              clearTokens();
              router.replace("/login");
            }}
            className="rounded border border-[var(--line)] px-2.5 py-1 text-[11px] text-[var(--muted)] hover:text-white hover:bg-[var(--panel-2)]"
          >
            Sign out
          </button>
        </div>
      </div>
      <MarketTicker />
    </header>
  );
}
