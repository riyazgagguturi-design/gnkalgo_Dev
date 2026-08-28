import json

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.brokers.factory import get_broker_adapter
from app.core.deps import get_current_user
from app.core.security import decode_token
from app.database import get_db
from app.models import User
from app.services.candle_service import candle_service
from app.services.instrument_service import instrument_service
from app.services.market_service import get_indices, market_session
from app.services.market_ws_manager import subscribe_ws, unsubscribe_all, unsubscribe_ws
from app.services.portfolio_service import portfolio_service

router = APIRouter(prefix="/market", tags=["Market"])


@router.get("/indices")
async def market_indices():
    return get_indices()


@router.get("/status")
async def market_status():
    return market_session()


@router.get("/instruments/search")
async def search_instruments(q: str = Query(default="", max_length=64), limit: int = Query(default=20, le=50)):
    return {"items": instrument_service.search(q, limit)}


@router.get("/candles")
async def market_candles(
    symbol: str = Query(..., min_length=1, max_length=32),
    exchange: str = Query(default="NSE"),
    interval: str = Query(default="5m"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    adapter = None
    conn = await portfolio_service._active_connection(db, current_user, "dhan")
    if conn:
        try:
            adapter = get_broker_adapter(conn)
        except Exception:
            adapter = None
    return await candle_service.get_candles(symbol, exchange, interval, adapter=adapter)


@router.get("/quote")
async def market_quote(
    symbol: str = Query(..., min_length=1),
    exchange: str = Query(default="NSE"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    inst = instrument_service.get(symbol)
    if not inst:
        raise HTTPException(status_code=404, detail="Instrument not found")

    ltp = None
    change = 0.0
    change_pct = 0.0
    conn = await portfolio_service._active_connection(db, current_user, "dhan")
    if conn:
        try:
            adapter = get_broker_adapter(conn)
            quote = await adapter.get_market_quote([inst["security_id"]])
            # Dhan LTP response shape varies
            ltp = float(quote.get("data", {}).get("NSE_EQ", {}).get(inst["security_id"], 0) or 0)
        except Exception:
            ltp = None

    if ltp is None:
        from app.services.candle_service import BASE_PRICES
        ltp = BASE_PRICES.get(inst["symbol"], 1000.0)

    return {
        "symbol": inst["symbol"],
        "display_name": inst["display_name"],
        "exchange": inst["exchange"],
        "ltp": ltp,
        "change": change,
        "change_pct": change_pct,
        "security_id": inst["security_id"],
    }


@router.websocket("/ws")
async def market_websocket(ws: WebSocket):
    token = ws.query_params.get("token")
    if not token:
        await ws.close(code=4401)
        return
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await ws.close(code=4401)
        return

    await ws.accept()
    try:
        while True:
            raw = await ws.receive_text()
            data = json.loads(raw)
            action = data.get("action")
            symbol = data.get("symbol", "").upper()
            exchange = data.get("exchange", "NSE").upper()
            if action == "subscribe" and symbol:
                await subscribe_ws(ws, symbol, exchange)
                await ws.send_text(json.dumps({"type": "subscribed", "symbol": symbol, "exchange": exchange}))
            elif action == "unsubscribe" and symbol:
                await unsubscribe_ws(ws, symbol, exchange)
                await ws.send_text(json.dumps({"type": "unsubscribed", "symbol": symbol}))
    except WebSocketDisconnect:
        await unsubscribe_all(ws)
    except Exception:
        await unsubscribe_all(ws)
        await ws.close()
