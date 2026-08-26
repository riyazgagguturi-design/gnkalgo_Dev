"use client";

import { api } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Checkout = {
  payment_id: string;
  reference: string;
  amount_inr: number;
  days: number;
  plan_code: string;
  intents: { upi: string; gpay: string; phonepe: string; paytm: string; vpa: string; payee: string };
  instructions: string;
};

function PayInner() {
  const params = useSearchParams();
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [utr, setUtr] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("gnk_checkout");
    if (!raw) return;
    const parsed = JSON.parse(raw) as Checkout;
    if (params.get("id") && parsed.payment_id !== params.get("id")) return;
    setCheckout(parsed);
  }, [params]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!checkout) return;
    setError("");
    try {
      const res = await api<{ message: string }>(
        `/api/v1/billing/payments/${checkout.payment_id}/utr`,
        { method: "POST", body: JSON.stringify({ utr }) },
        true,
      );
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit UTR");
    }
  }

  if (!checkout) {
    return (
      <main className="mx-auto max-w-lg px-6 py-12">
        <Logo href="/subscribe" size={44} />
        <p className="mt-6 text-slate-400">No payment in progress. Choose a plan first.</p>
        <a href="/subscribe" className="mt-4 inline-block text-[#2ee6a6]">Back to plans</a>
      </main>
    );
  }

  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(checkout.intents.upi)}`;
  const apps = [
    { href: checkout.intents.phonepe, label: "PhonePe" },
    { href: checkout.intents.gpay, label: "GPay" },
    { href: checkout.intents.paytm, label: "Paytm" },
    { href: checkout.intents.upi, label: "Any UPI app" },
  ];

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Logo href="/subscribe" size={44} />
      <h1 className="mt-6 text-2xl font-semibold">Pay ₹{checkout.amount_inr} with UPI</h1>
      <p className="mt-2 text-sm text-slate-400">
        Send exactly ₹{checkout.amount_inr} to <span className="text-[#2ee6a6]">{checkout.intents.vpa}</span>
        {" "}({checkout.intents.payee}). Reference: <span className="text-white">{checkout.reference}</span>
      </p>
      <img src={qr} alt="UPI QR" className="mt-6 rounded-xl bg-white p-2" width={220} height={220} />
      <div className="mt-5 grid grid-cols-2 gap-2">
        {apps.map((app) => (
          <a key={app.label} href={app.href} className="rounded-xl border border-[#1d3542] px-3 py-2 text-center text-sm hover:bg-[#123348]">
            {app.label}
          </a>
        ))}
      </div>
      <form onSubmit={onSubmit} className="mt-8 rounded-2xl border border-[#1d3542] bg-[#0d1b24]/70 p-5">
        <label className="text-sm">UTR / UPI Ref No. (from PhonePe, GPay, or Paytm)</label>
        <input
          className="mt-1 w-full rounded-lg border border-[#1d3542] bg-[#071018] px-3 py-2"
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          minLength={6}
          required
        />
        {error && <p className="mt-3 text-sm text-[#ff6b6b]">{error}</p>}
        {message && <p className="mt-3 text-sm text-[#2ee6a6]">{message}</p>}
        <button className="mt-4 w-full rounded-xl bg-[#2ee6a6] py-2.5 font-semibold text-[#071018]">I have paid</button>
      </form>
    </main>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<main className="p-10 text-slate-400">Loading…</main>}>
      <PayInner />
    </Suspense>
  );
}
