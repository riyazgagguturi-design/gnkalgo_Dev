import { api } from "@/lib/api";
import type { Candle } from "@/lib/indicators";

export type Instrument = {
  symbol: string;
  display_name: string;
  exchange: string;
  segment: string;
  security_id: string;
  instrument_token: string;
};

export type Quote = {
  symbol: string;
  display_name: string;
  exchange: string;
  ltp: number;
  change: number;
  change_pct: number;
  security_id: string;
};

export async function searchInstruments(q: string): Promise<Instrument[]> {
  const res = await api<{ items: Instrument[] }>(
    `/api/v1/market/instruments/search?q=${encodeURIComponent(q)}`,
    {},
    true,
  );
  return res.items;
}

export async function fetchCandles(
  symbol: string,
  exchange: string,
  interval: string,
): Promise<{ candles: Candle[]; source: string }> {
  const params = new URLSearchParams({ symbol, exchange, interval });
  const res = await api<{ candles: Candle[]; source: string }>(
    `/api/v1/market/candles?${params}`,
    {},
    true,
  );
  return res;
}

export async function fetchQuote(symbol: string, exchange: string): Promise<Quote> {
  const params = new URLSearchParams({ symbol, exchange });
  return api<Quote>(`/api/v1/market/quote?${params}`, {}, true);
}

export async function fetchBrokerStatus(): Promise<{
  status: string;
  connected?: boolean;
}> {
  const res = await api<{ status: string; connected?: boolean }>(
    "/api/v1/portfolio/broker-status?broker=dhan",
    {},
    true,
  );
  return { status: res.status, connected: res.status === "connected" };
}
