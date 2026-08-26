"use client";

import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { FormEvent, useEffect, useState } from "react";

type Strategy = {
  id: string;
  name: string;
  description: string | null;
  symbol: string;
  rules_json: string;
  status: string;
  paper_mode: boolean;
  max_quantity: number;
  schedule_enabled: boolean;
  interval_minutes: number;
  last_scheduled_run_at: string | null;
};

type FormState = {
  name: string;
  description: string;
  symbol: string;
  action: "BUY" | "SELL";
  qty: number;
  paper_mode: boolean;
  max_quantity: number;
  schedule_enabled: boolean;
  interval_minutes: number;
};

const DEFAULT_FORM: FormState = {
  name: "Momentum paper",
  description: "",
  symbol: "RELIANCE",
  action: "BUY",
  qty: 1,
  paper_mode: true,
  max_quantity: 100,
  schedule_enabled: false,
  interval_minutes: 15,
};

function parseRules(json: string): { action: "BUY" | "SELL"; qty: number } {
  try {
    const raw = JSON.parse(json || "{}");
    const action = raw.action === "SELL" ? "SELL" : "BUY";
    const qty = Number(raw.qty) > 0 ? Number(raw.qty) : 1;
    return { action, qty };
  } catch {
    return { action: "BUY", qty: 1 };
  }
}

function formPayload(form: FormState, editingId: string | null) {
  const body = {
    name: form.name,
    description: form.description || null,
    symbol: form.symbol,
    action: form.action,
    qty: form.qty,
    paper_mode: form.paper_mode,
    max_quantity: form.max_quantity,
    schedule_enabled: form.schedule_enabled,
    interval_minutes: form.schedule_enabled ? form.interval_minutes : 0,
  };
  return editingId
    ? body
    : { ...body, description: form.description || undefined };
}

export default function StrategiesPage() {
  const [items, setItems] = useState<Strategy[]>([]);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setItems(await api<Strategy[]>("/api/v1/strategies/", {}, true));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  function startEdit(s: Strategy) {
    const rules = parseRules(s.rules_json);
    setEditingId(s.id);
    setForm({
      name: s.name,
      description: s.description || "",
      symbol: s.symbol,
      action: rules.action,
      qty: rules.qty,
      paper_mode: s.paper_mode,
      max_quantity: s.max_quantity,
      schedule_enabled: s.schedule_enabled,
      interval_minutes: s.interval_minutes > 0 ? s.interval_minutes : 15,
    });
    setMessage("");
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(DEFAULT_FORM);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const payload = formPayload(form, editingId);
    try {
      if (editingId) {
        await api(`/api/v1/strategies/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        }, true);
        setMessage("Strategy updated.");
      } else {
        await api("/api/v1/strategies/", {
          method: "POST",
          body: JSON.stringify(payload),
        }, true);
        setMessage("Strategy created.");
        setForm(DEFAULT_FORM);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function run(id: string) {
    setError("");
    try {
      const res = await api<{ notes: string }>(`/api/v1/strategies/${id}/run`, { method: "POST" }, true);
      setMessage(res.notes);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run failed");
    }
  }

  async function togglePause(s: Strategy) {
    setError("");
    const paused = s.status === "PAUSED";
    try {
      await api(`/api/v1/strategies/${s.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: paused ? (s.paper_mode ? "PAPER" : "LIVE") : "PAUSED" }),
      }, true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    }
  }

  return (
    <AppShell>
      <h1 className="text-3xl font-semibold">Strategy builder</h1>
      <p className="mt-2 text-sm text-slate-400">
        Set BUY/SELL, quantity, paper or live, and optional schedule (runs every N minutes in the background).
      </p>
      {error && <p className="mt-3 text-[#ff6b6b]">{error}</p>}
      {message && <p className="mt-3 text-sm text-[#2ee6a6]">{message}</p>}

      <form onSubmit={save} className="mt-6 rounded-2xl border border-[#1d3542] bg-[#0d1b24]/70 p-5">
        <h2 className="font-medium">{editingId ? "Edit strategy" : "New strategy"}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            Name
            <input
              className="mt-1 w-full rounded-lg border border-[#1d3542] bg-[#071018] px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label className="block text-sm">
            Symbol (NSE)
            <input
              className="mt-1 w-full rounded-lg border border-[#1d3542] bg-[#071018] px-3 py-2"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
              required
            />
          </label>
          <label className="block text-sm md:col-span-2">
            Description
            <input
              className="mt-1 w-full rounded-lg border border-[#1d3542] bg-[#071018] px-3 py-2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Side
            <select
              className="mt-1 w-full rounded-lg border border-[#1d3542] bg-[#071018] px-3 py-2"
              value={form.action}
              onChange={(e) => setForm({ ...form, action: e.target.value as "BUY" | "SELL" })}
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </label>
          <label className="block text-sm">
            Quantity
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-lg border border-[#1d3542] bg-[#071018] px-3 py-2"
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
              required
            />
          </label>
          <label className="block text-sm">
            Max qty cap
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-lg border border-[#1d3542] bg-[#071018] px-3 py-2"
              value={form.max_quantity}
              onChange={(e) => setForm({ ...form, max_quantity: Number(e.target.value) })}
            />
          </label>
          <label className="flex items-center gap-3 text-sm pt-6">
            <input
              type="checkbox"
              checked={form.paper_mode}
              onChange={(e) => setForm({ ...form, paper_mode: e.target.checked })}
            />
            Paper mode (no real money)
          </label>
          <label className="flex items-center gap-3 text-sm pt-6">
            <input
              type="checkbox"
              checked={form.schedule_enabled}
              onChange={(e) => setForm({ ...form, schedule_enabled: e.target.checked })}
            />
            Run on schedule (no webhook)
          </label>
          {form.schedule_enabled && (
            <label className="block text-sm">
              Every N minutes
              <input
                type="number"
                min={1}
                max={1440}
                className="mt-1 w-full rounded-lg border border-[#1d3542] bg-[#071018] px-3 py-2"
                value={form.interval_minutes}
                onChange={(e) => setForm({ ...form, interval_minutes: Number(e.target.value) })}
                required
              />
            </label>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="submit" className="rounded-xl bg-[#2ee6a6] px-5 py-2 font-semibold text-[#071018]">
            {editingId ? "Save changes" : "Create strategy"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="rounded-xl border border-[#1d3542] px-5 py-2 text-sm">
              Cancel
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          rules_json: {JSON.stringify({ action: form.action, qty: form.qty })}
        </p>
      </form>

      <div className="mt-8 grid gap-4">
        {items.map((s) => {
          const rules = parseRules(s.rules_json);
          return (
            <div key={s.id} className="rounded-2xl border border-[#1d3542] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {s.symbol} · {rules.action} × {rules.qty} · {s.paper_mode ? "paper" : "live"} · {s.status}
                  </p>
                  {s.schedule_enabled && (
                    <p className="mt-1 text-sm text-[#2ee6a6]">
                      Scheduled every {s.interval_minutes} min
                      {s.last_scheduled_run_at ? ` · last run ${s.last_scheduled_run_at}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => startEdit(s)} className="rounded-lg border border-[#1d3542] px-3 py-2 text-sm">
                    Edit
                  </button>
                  <button onClick={() => run(s.id)} className="rounded-lg border border-[#1d3542] px-3 py-2 text-sm">
                    Run once
                  </button>
                  {s.schedule_enabled && (
                    <button onClick={() => togglePause(s)} className="rounded-lg border border-[#1d3542] px-3 py-2 text-sm">
                      {s.status === "PAUSED" ? "Resume schedule" : "Pause schedule"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {!items.length && <p className="text-slate-500">No strategies yet. Create one above.</p>}
      </div>
    </AppShell>
  );
}
