"use client";

import { AppShell } from "@/components/AppShell";
import { QuickOrderPanel } from "@/components/orders/QuickOrderPanel";
import {
  EmptyState,
  PageHeader,
  Panel,
  TabBar,
  TerminalInput,
} from "@/components/ui/terminal";
import {
  loadWatchlists,
  saveWatchlists,
  type WatchlistItem,
  type Watchlists,
} from "@/lib/watchlist";
import { useEffect, useState } from "react";

const LIST_NAMES = ["Watchlist 1", "Watchlist 2", "Watchlist 3"];

export default function WatchlistPage() {
  const [lists, setLists] = useState<Watchlists>({});
  const [activeList, setActiveList] = useState("Watchlist 1");
  const [symbol, setSymbol] = useState("");
  const [exchange, setExchange] = useState("NSE");
  const [tradeSymbol, setTradeSymbol] = useState<string | undefined>();
  const [tradeSide, setTradeSide] = useState<"BUY" | "SELL" | undefined>();

  useEffect(() => {
    setLists(loadWatchlists());
  }, []);

  function persist(next: Watchlists) {
    setLists(next);
    saveWatchlists(next);
  }

  function addSymbol() {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;
    const items = lists[activeList] || [];
    if (items.some((i) => i.symbol === sym)) return;
    const next = {
      ...lists,
      [activeList]: [...items, { symbol: sym, exchange }],
    };
    persist(next);
    setSymbol("");
  }

  function removeItem(item: WatchlistItem) {
    const next = {
      ...lists,
      [activeList]: (lists[activeList] || []).filter((i) => i.symbol !== item.symbol),
    };
    persist(next);
  }

  const items = lists[activeList] || [];
  const tabs = LIST_NAMES.map((n) => ({ id: n, label: n }));

  return (
    <AppShell>
      <PageHeader title="Watchlist" subtitle="Track symbols · search adds to active list" />
      <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
        <Panel>
          <TabBar tabs={tabs} active={activeList} onChange={setActiveList} />
          <div className="flex flex-wrap gap-2 p-2 border-b border-[var(--line)]">
            <TerminalInput
              placeholder="Symbol e.g. RELIANCE"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-40"
            />
            <select
              className="rounded border border-[var(--line)] bg-[var(--background)] px-2 py-1.5 text-xs"
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
            >
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
            </select>
            <button
              type="button"
              onClick={addSymbol}
              className="rounded bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-black"
            >
              Add
            </button>
          </div>
          {items.length ? (
            <div className="overflow-x-auto">
              <table className="terminal-table w-full">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--panel-2)]">
                    {["Symbol", "Exchange", "Actions"].map((h) => (
                      <th key={h} className="px-2 py-1.5 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.symbol} className="border-t border-[var(--line)]">
                      <td className="px-2 py-1.5 font-medium text-white">{item.symbol}</td>
                      <td className="px-2 py-1.5 text-[var(--muted)]">{item.exchange}</td>
                      <td className="px-2 py-1.5">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setTradeSymbol(item.symbol);
                              setTradeSide("BUY");
                            }}
                            className="text-[10px] text-[var(--profit)]"
                          >
                            Buy
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTradeSymbol(item.symbol);
                              setTradeSide("SELL");
                            }}
                            className="text-[10px] text-[var(--loss)]"
                          >
                            Sell
                          </button>
                          <button type="button" onClick={() => removeItem(item)} className="text-[10px] text-[var(--muted)]">
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Empty watchlist" detail="Add symbols manually. Live LTP requires market feed." />
          )}
          <p className="p-2 text-[10px] text-[var(--muted)]">
            Instrument search API not connected yet. LTP/Bid/Ask/Volume will appear when live feed is enabled.
          </p>
        </Panel>
        <QuickOrderPanel defaultSymbol={tradeSymbol} defaultSide={tradeSide} />
      </div>
    </AppShell>
  );
}
