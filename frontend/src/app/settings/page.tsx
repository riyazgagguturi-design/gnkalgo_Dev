"use client";

import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { FormEvent, useEffect, useState } from "react";

type Me = { email: string; full_name?: string | null; mfa_enabled: boolean; is_verified: boolean };
type Broker = { id: string; broker: string; health_status: string; is_active: boolean };

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [broker, setBroker] = useState("dhan");
  const [accessToken, setAccessToken] = useState("");
  const [clientId, setClientId] = useState("");
  const [qr, setQr] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setMe(await api<Me>("/api/v1/auth/me", {}, true));
    setBrokers(await api<Broker[]>("/api/v1/brokers/connections", {}, true));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function connect(e: FormEvent) {
    e.preventDefault();
    setError("");
    await api("/api/v1/brokers/connect", {
      method: "POST",
      body: JSON.stringify({ broker, access_token: accessToken, client_id: clientId || null }),
    }, true);
    setMessage("Broker credentials saved (encrypted).");
    await load();
  }

  async function setupMfa() {
    const res = await api<{ qr_uri: string; secret: string }>("/api/v1/auth/mfa/setup", { method: "POST" }, true);
    setQr(res.qr_uri);
    setMessage(`TOTP secret: ${res.secret}`);
  }

  async function enableMfa(e: FormEvent) {
    e.preventDefault();
    await api("/api/v1/auth/mfa/enable", { method: "POST", body: JSON.stringify({ code: mfaCode }) }, true);
    setMessage("MFA enabled");
    await load();
  }

  return (
    <AppShell>
      <h1 className="text-3xl font-semibold">Settings</h1>
      <p className="mt-2 text-slate-400">{me?.email} · verified: {String(me?.is_verified)} · MFA: {String(me?.mfa_enabled)}</p>
      {error && <p className="mt-3 text-[#ff6b6b]">{error}</p>}
      {message && <p className="mt-3 text-sm text-[#2ee6a6] break-all">{message}</p>}

      <section className="mt-8 rounded-2xl border border-[#1d3542] p-5">
        <h2 className="font-medium">Connect broker</h2>
        <form onSubmit={connect} className="mt-4 grid gap-3 md:grid-cols-2">
          <select className="rounded-lg border border-[#1d3542] bg-[#071018] px-3 py-2" value={broker} onChange={(e) => setBroker(e.target.value)}>
            <option value="dhan">Dhan</option>
            <option value="groww">Groww</option>
          </select>
          <input className="rounded-lg border border-[#1d3542] bg-[#071018] px-3 py-2" placeholder="Client ID" value={clientId} onChange={(e) => setClientId(e.target.value)} />
          <input className="md:col-span-2 rounded-lg border border-[#1d3542] bg-[#071018] px-3 py-2" placeholder="Access token / API key" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
          <button className="rounded-xl bg-[#2ee6a6] px-4 py-2 font-semibold text-[#071018]">Save encrypted</button>
        </form>
        <ul className="mt-4 text-sm text-slate-400">
          {brokers.map((b) => (
            <li key={b.id}>{b.broker} · {b.health_status}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-[#1d3542] p-5">
        <h2 className="font-medium">Multi-factor authentication</h2>
        <button onClick={setupMfa} className="mt-4 rounded-lg border border-[#1d3542] px-3 py-2 text-sm">Generate TOTP secret</button>
        {qr && <p className="mt-3 break-all text-xs text-slate-400">{qr}</p>}
        <form onSubmit={enableMfa} className="mt-4 flex gap-3">
          <input className="rounded-lg border border-[#1d3542] bg-[#071018] px-3 py-2" placeholder="6-digit code" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} />
          <button className="rounded-xl bg-[#2ee6a6] px-4 py-2 font-semibold text-[#071018]">Enable MFA</button>
        </form>
      </section>
    </AppShell>
  );
}
