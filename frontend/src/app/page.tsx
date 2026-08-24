export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-[#2ee6a6]">Indian markets · NSE / BSE / MCX</p>
      <h1 className="mt-4 text-5xl font-semibold leading-tight">
        GnKAlgo
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-300">
        Algo trading platform for the Indian stock market. Connect Dhan and Groww, run strategies,
        consume TradingView webhooks, and generate AI signals.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a href="/register" className="rounded-xl bg-[#2ee6a6] px-5 py-3 text-sm font-semibold text-[#071018]">
          Create account
        </a>
        <a href="/login" className="rounded-xl border border-[#1d3542] px-5 py-3 text-sm">
          Login
        </a>
      </div>
      <section className="mt-14 grid gap-4 md:grid-cols-3">
        {[
          ["Dhan + Groww", "Unified broker adapters with encrypted credentials."],
          ["AI signals", "RSI/MACD features with a Random Forest classifier."],
          ["Webhooks", "Inbound alerts to paper or live orders with HMAC."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-2xl border border-[#1d3542] bg-[#0d1b24]/70 p-5">
            <h2 className="font-medium text-[#2ee6a6]">{title}</h2>
            <p className="mt-2 text-sm text-slate-400">{body}</p>
          </div>
        ))}
      </section>
      <p className="mt-10 text-xs text-slate-500">
        Not investment advice. Trading involves risk. Use paper mode until you understand the flow.
      </p>
    </main>
  );
}
