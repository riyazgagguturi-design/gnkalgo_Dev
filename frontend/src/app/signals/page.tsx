"use client";

import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";

type Signal = {
  id: string;
  symbol: string;
  action: string;
  confidence: number;
  price?: number | null;
  created_at: string;
};

export default function SignalsPage() {
  const [items, setItems] = useState<Signal[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setItems(await api<Signal[]>("/api/v1/signals/", {}, true));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      await api("/api/v1/signals/generate", { method: "POST" }, true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generate failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">AI Signals</h1>
        <button onClick={generate} className="rounded-xl bg-[#2ee6a6] px-4 py-2 font-semibold text-[#071018]">
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-400">Not investment advice. Model uses RSI, MACD, volume features.</p>
      {error && <p className="mt-3 text-[#ff6b6b]">{error}</p>}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-[#1d3542]">
        <table className="w-full text-sm">
          <thead className="bg-[#123348] text-left">
            <tr>
              <th className="p-3">Symbol</th>
              <th>Action</th>
              <th>Confidence</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} className="border-t border-[#1d3542]">
                <td className="p-3">{s.symbol}</td>
                <td className={s.action === "BUY" ? "text-[#2ee6a6]" : s.action === "SELL" ? "text-[#ff6b6b]" : ""}>{s.action}</td>
                <td>{(s.confidence * 100).toFixed(1)}%</td>
                <td>{s.price ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
