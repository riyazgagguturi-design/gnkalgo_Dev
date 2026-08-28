import asyncio
import json
import random
from datetime import datetime, timezone

from app.services.candle_service import BASE_PRICES

# Shared mock tick broadcaster for dev / when Dhan WS unavailable
_subscribers: dict[str, set] = {}
_prices: dict[str, float] = {}
_task: asyncio.Task | None = None


def _base_price(symbol: str) -> float:
    from app.services.candle_service import BASE_PRICES as BP
    return BP.get(symbol.upper(), 1000.0)


async def _broadcast_loop():
    while True:
        for key, sockets in list(_subscribers.items()):
            symbol = key.split(":")[0]
            base = _prices.get(key, _base_price(symbol))
            drift = random.uniform(-0.002, 0.002) * base
            price = round(base + drift, 2)
            _prices[key] = price
            msg = json.dumps({
                "type": "tick",
                "symbol": symbol,
                "ltp": price,
                "time": int(datetime.now(timezone.utc).timestamp()),
            })
            dead = []
            for ws in sockets:
                try:
                    await ws.send_text(msg)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                sockets.discard(ws)
        await asyncio.sleep(1.5)


def start_broadcast():
    global _task
    if _task is None or _task.done():
        _task = asyncio.create_task(_broadcast_loop())


async def subscribe_ws(ws, symbol: str, exchange: str):
    key = f"{symbol.upper()}:{exchange.upper()}"
    if key not in _subscribers:
        _subscribers[key] = set()
    _subscribers[key].add(ws)
    start_broadcast()


async def unsubscribe_ws(ws, symbol: str, exchange: str):
    key = f"{symbol.upper()}:{exchange.upper()}"
    if key in _subscribers:
        _subscribers[key].discard(ws)


async def unsubscribe_all(ws):
    for sockets in _subscribers.values():
        sockets.discard(ws)
