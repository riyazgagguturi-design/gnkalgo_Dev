"use client";

import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";

type Summary = {
  user: string;
  orders_count: number;
  active_strategies: number;
  signals_count: number;
  broker_status: Record<string, string>;
  recent_signals: { symbol: string; action: string; confidence: number }[];
  recent_orders: { symbol: string; side: string; status: string; quantity: number }[];
  disclaimer: string;
};

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Summary>("/api/v1/dashboard/summary", {}, true)
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <AppShell>
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-slate-400">Welcome {data?.user || ""}</p>
      {error && <p className="mt-3 text-[#ff6b6b]">{error}</p>}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          ["Orders", data?.orders_count ?? "—"],
          ["Strategies", data?.active_strategies ?? "—"],
          ["Signals", data?.signals_count ?? "—"],
          ["Dhan", data?.broker_status.dhan ?? "—"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[#1d3542] bg-[#0d1b24]/70 p-5">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{String(value)}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#1d3542] p-5">
          <h2 className="font-medium">Recent orders</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.recent_orders || []).map((o, i) => (
              <li key={i} className="flex justify-between text-slate-300">
                <span>{o.side} {o.symbol} × {o.quantity}</span>
                <span>{o.status}</span>
              </li>
            ))}
            {!data?.recent_orders?.length && <li className="text-slate-500">No orders yet</li>}
          </ul>
        </div>
        <div className="rounded-2xl border border-[#1d3542] p-5">
          <h2 className="font-medium">Recent AI signals</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.recent_signals || []).map((s, i) => (
              <li key={i} className="flex justify-between text-slate-300">
                <span>{s.symbol} {s.action}</span>
                <span>{(s.confidence * 100).toFixed(0)}%</span>
              </li>
            ))}
            {!data?.recent_signals?.length && <li className="text-slate-500">Generate signals from AI Signals</li>}
          </ul>
        </div>
      </div>
      <p className="mt-6 text-xs text-slate-500">{data?.disclaimer}</p>
    </AppShell>
  );
}
