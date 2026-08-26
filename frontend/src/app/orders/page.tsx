"use client";

import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { FormEvent, useEffect, useState } from "react";

type Order = {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  status: string;
  broker: string;
  source: string;
  message?: string | null;
  created_at: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [symbol, setSymbol] = useState("RELIANCE");
  const [side, setSide] = useState("BUY");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");

  async function load() {
    const rows = await api<Order[]>("/api/v1/orders/", {}, true);
    setOrders(rows);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/v1/orders/", {
        method: "POST",
        body: JSON.stringify({
          symbol,
          side,
          quantity: Number(qty),
          paper_mode: true,
          broker: "paper",
        }),
      }, true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order failed");
    }
  }

  return (
    <AppShell>
      <h1 className="text-3xl font-semibold">Orders</h1>
      <p className="mt-2 text-sm text-slate-400">Start with paper orders (no broker call). Live Dhan/Groww requires MFA plus a connected broker.</p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-[#1d3542] p-5">
        <input className="rounded-lg border border-[#1d3542] bg-[#071018] px-3 py-2" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        <select className="rounded-lg border border-[#1d3542] bg-[#071018] px-3 py-2" value={side} onChange={(e) => setSide(e.target.value)}>
          <option>BUY</option>
          <option>SELL</option>
        </select>
        <input className="w-24 rounded-lg border border-[#1d3542] bg-[#071018] px-3 py-2" type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
        <button className="rounded-xl bg-[#2ee6a6] px-4 py-2 font-semibold text-[#071018]">Paper order</button>
      </form>
      {error && <p className="mt-3 text-[#ff6b6b]">{error}</p>}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-[#1d3542]">
        <table className="w-full text-sm">
          <thead className="bg-[#123348] text-left">
            <tr>
              <th className="p-3">Symbol</th>
              <th>Side</th>
              <th>Qty</th>
              <th>Status</th>
              <th>Source</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-[#1d3542]">
                <td className="p-3">{o.symbol}</td>
                <td>{o.side}</td>
                <td>{o.quantity}</td>
                <td>{o.status}</td>
                <td>{o.source}</td>
                <td className="text-slate-400">{o.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
