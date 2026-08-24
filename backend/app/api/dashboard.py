from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database import get_db
from app.models import BrokerConnection, Order, Signal, Strategy, User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    orders_count = await db.scalar(select(func.count()).select_from(Order).where(Order.user_id == current_user.id))
    strategies_count = await db.scalar(
        select(func.count()).select_from(Strategy).where(Strategy.user_id == current_user.id)
    )
    signals_count = await db.scalar(select(func.count()).select_from(Signal).where(Signal.user_id == current_user.id))
    brokers = await db.execute(
        select(BrokerConnection).where(BrokerConnection.user_id == current_user.id)
    )
    broker_status = {"dhan": "not_connected", "groww": "not_connected"}
    for conn in brokers.scalars():
        broker_status[conn.broker.value] = conn.health_status

    latest_signals = await db.execute(
        select(Signal).where(Signal.user_id == current_user.id).order_by(Signal.created_at.desc()).limit(5)
    )
    latest_orders = await db.execute(
        select(Order).where(Order.user_id == current_user.id).order_by(Order.created_at.desc()).limit(5)
    )

    return {
        "user": current_user.full_name or current_user.email,
        "orders_count": orders_count or 0,
        "active_strategies": strategies_count or 0,
        "signals_count": signals_count or 0,
        "broker_status": broker_status,
        "recent_signals": [
            {"symbol": s.symbol, "action": s.action, "confidence": s.confidence} for s in latest_signals.scalars()
        ],
        "recent_orders": [
            {"symbol": o.symbol, "side": o.side, "status": o.status, "quantity": o.quantity}
            for o in latest_orders.scalars()
        ],
        "disclaimer": "Not investment advice. For educational purposes only.",
    }
