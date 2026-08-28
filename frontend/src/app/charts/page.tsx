"use client";

import { AppShell } from "@/components/AppShell";
import { LatestNews } from "@/components/news/LatestNews";
import { PageHeader, Panel, TerminalInput } from "@/components/ui/terminal";
import { useState } from "react";

export default function ChartsPage() {
  const [symbol, setSymbol] = useState("NIFTY");

  return (
    <AppShell>
      <PageHeader title="Charts" subtitle="Market chart with latest news" />
      <Panel className="p-4 mb-3">
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <label className="text-[11px] text-[var(--text-secondary)]">
            Symbol
            <TerminalInput
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="mt-1 w-40"
              placeholder="RELIANCE"
            />
          </label>
        </div>
        <div
          className="flex h-64 items-center justify-center rounded border border-[var(--border)] bg-[var(--surface-secondary)] text-sm text-[var(--text-secondary)]"
          role="img"
          aria-label="Market chart placeholder"
        >
          Chart for {symbol} — embed TradingView or chart provider in a future release
        </div>
      </Panel>
      <LatestNews symbol={symbol} />
    </AppShell>
  );
}
