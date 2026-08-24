"use client";

import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { FormEvent, useEffect, useState } from "react";

type Strategy = {
  id: string;
  name: string;
  symbol: string;
  status: string;
  paper_mode: boolean;
};

export default function StrategiesPage() {
  const [items, setItems] = useState<Strategy[]>([]);
  const [name, setName] = useState("Momentum paper");
  const [symbol, setSymbol] = useState("RELIANCE");
  const [error, setError] = useState("");

  async function load() {
    setItems(await api<Strategy[]>("/api/v1/strategies/", {}, true));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    await api("/api/v1/strategies/", {
      method: "POST",
      body: JSON.stringify({ name, symbol, paper_mode: true, rules_json: '{"action":"BUY","qty":1}' }),
    }, true);
    await load();
  }

  async function run(id: string) {
    await api(`/api/v1/strategies/${id}/run`, { method: "POST" }, true);
    await load();
  }

  return (
    <AppShell>
      <h1 className="text-3xl font-semibold">Strategies</h1>
      {error && <p className="mt-3 text-[#ff6b6b]">{error}</p>}
      <form onSubmit={create} className="mt-6 flex flex-wrap gap-3">
        <input className="rounded-lg border border-[#1d3542] bg-[#071018] px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="rounded-lg border border-[#1d3542] bg-[#071018] px-3 py-2" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        <button className="rounded-xl bg-[#2ee6a6] px-4 py-2 font-semibold text-[#071018]">Create</button>
      </form>
      <div className="mt-6 grid gap-4">
        {items.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-2xl border border-[#1d3542] p-5">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-slate-400">{s.symbol} · {s.status} · {s.paper_mode ? "paper" : "live"}</p>
            </div>
            <button onClick={() => run(s.id)} className="rounded-lg border border-[#1d3542] px-3 py-2 text-sm">Run once</button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
