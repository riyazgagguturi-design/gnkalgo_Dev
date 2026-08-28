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
  plan_label?: string;
  intents: { upi: string; gpay: string; phonepe: string; paytm: string; vpa: string; payee: string };
  instructions?: string;
  support_email?: string;
  admin_url?: string;
};

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 2000);
      }}
      className="rounded-lg border border-[#1d3542] px-2 py-1 text-xs text-slate-300 hover:bg-[#123348]"
    >
      {ok ? "Copied" : label}
    </button>
  );
}

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

  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(checkout.intents.upi)}`;
  const apps = [
    { href: checkout.intents.phonepe, label: "Open PhonePe" },
    { href: checkout.intents.gpay, label: "Open GPay" },
    { href: checkout.intents.paytm, label: "Open Paytm" },
    { href: checkout.intents.upi, label: "Any UPI app" },
  ];
  const support = checkout.support_email || "support@gnkalgo.com";

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Logo href="/subscribe" size={44} />
      <h1 className="mt-6 text-2xl font-semibold">Complete UPI payment</h1>
      <p className="mt-2 text-slate-400">UPI only · PhonePe · Google Pay · Paytm</p>

      <section className="mt-6 rounded-2xl border border-[#1d3542] bg-[#0d1b24]/70 p-5">
        <h2 className="text-sm font-medium text-[#2ee6a6]">Order details</h2>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">Plan</dt>
            <dd className="font-medium">{checkout.plan_label || checkout.plan_code}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">Duration</dt>
            <dd>{checkout.days} day{checkout.days > 1 ? "s" : ""}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">Amount (pay exactly)</dt>
            <dd className="text-lg font-semibold text-[#2ee6a6]">₹{checkout.amount_inr}</dd>
          </div>
          <div className="flex justify-between gap-4 items-center">
            <dt className="text-slate-400">UPI ID (VPA)</dt>
            <dd className="flex items-center gap-2">
              <span className="font-mono text-[#2ee6a6]">{checkout.intents.vpa}</span>
              <CopyBtn text={checkout.intents.vpa} label="Copy VPA" />
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">Payee name</dt>
            <dd>{checkout.intents.payee}</dd>
          </div>
          <div className="flex justify-between gap-4 items-center">
            <dt className="text-slate-400">Payment reference</dt>
            <dd className="flex items-center gap-2">
              <span className="font-mono text-xs">{checkout.reference}</span>
              <CopyBtn text={checkout.reference} label="Copy ref" />
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">Payment ID</dt>
            <dd className="font-mono text-xs text-slate-500">{checkout.payment_id}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-[#1d3542] p-5">
        <h2 className="font-medium">How to pay</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-300">
          <li>Scan the QR code or tap your UPI app below.</li>
          <li>Pay <strong>exactly ₹{checkout.amount_inr}</strong> — not less or more.</li>
          <li>UPI ID: <strong>{checkout.intents.vpa}</strong> · Name: <strong>{checkout.intents.payee}</strong></li>
          <li>After payment, open PhonePe / GPay / Paytm → Transaction history → copy <strong>UTR</strong> or <strong>UPI Ref No.</strong></li>
          <li>Paste UTR below and tap <strong>I have paid</strong>.</li>
          <li>We confirm manually (usually within a few hours). You get access when status is confirmed.</li>
        </ol>
        {checkout.instructions && (
          <p className="mt-3 text-xs text-slate-500">{checkout.instructions}</p>
        )}
      </section>

      <div className="mt-6 flex flex-col items-center">
        <img src={qr} alt="UPI QR code" className="rounded-xl bg-white p-3" width={240} height={240} />
        <p className="mt-2 text-xs text-slate-500">Scan with any UPI app</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {apps.map((app) => (
          <a
            key={app.label}
            href={app.href}
            className="rounded-xl border border-[#1d3542] px-3 py-3 text-center text-sm font-medium hover:bg-[#123348]"
          >
            {app.label}
          </a>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-8 rounded-2xl border border-[#1d3542] bg-[#0d1b24]/70 p-5">
        <h2 className="font-medium">Submit payment proof</h2>
        <label className="mt-4 block text-sm">UTR / UPI Reference Number</label>
        <input
          className="mt-1 w-full rounded-lg border border-[#1d3542] bg-[#071018] px-3 py-2"
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          placeholder="12-digit UTR from your UPI app"
          minLength={6}
          required
        />
        {error && <p className="mt-3 text-sm text-[#ff6b6b]">{error}</p>}
        {message && (
          <p className="mt-3 text-sm text-[#2ee6a6]">
            {message} Track status on <a href="/dashboard" className="underline">Dashboard</a>.
          </p>
        )}
        <button className="mt-4 w-full rounded-xl bg-[#2ee6a6] py-2.5 font-semibold text-[#071018]">
          I have paid — submit UTR
        </button>
      </form>

      <section className="mt-6 rounded-2xl border border-[#1d3542] p-5 text-sm text-slate-400">
        <h2 className="font-medium text-slate-200">Help & support</h2>
        <ul className="mt-2 space-y-1">
          <li>Email: <a href={`mailto:${support}`} className="text-[#3aa0ff]">{support}</a></li>
          <li>Wrong amount sent? Email us with UTR and registered email.</li>
          <li>Cards and net banking are not accepted — UPI only.</li>
          <li>
            <a href="/subscribe" className="text-[#2ee6a6]">Change plan</a>
            {" · "}
            <a href="/login" className="text-[#2ee6a6]">Login</a>
          </li>
        </ul>
      </section>
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
