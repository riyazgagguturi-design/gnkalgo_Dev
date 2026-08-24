import json
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Strategy, StrategyRun, User
from app.schemas.trading import PlaceOrderRequest, StrategyCreateRequest
from app.services.order_service import order_service


class StrategyService:
    async def list_strategies(self, db: AsyncSession, user: User) -> list[Strategy]:
        result = await db.execute(select(Strategy).where(Strategy.user_id == user.id))
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, user: User, data: StrategyCreateRequest) -> Strategy:
        strategy = Strategy(
            user_id=user.id,
            name=data.name,
            description=data.description,
            symbol=data.symbol.upper(),
            rules_json=data.rules_json,
            paper_mode=data.paper_mode,
            max_quantity=data.max_quantity,
            max_daily_loss=data.max_daily_loss,
            status="DRAFT",
        )
        db.add(strategy)
        await db.flush()
        return strategy

    async def set_status(self, db: AsyncSession, user: User, strategy_id: uuid.UUID, status: str) -> Strategy:
        result = await db.execute(
            select(Strategy).where(Strategy.id == strategy_id, Strategy.user_id == user.id)
        )
        strategy = result.scalar_one_or_none()
        if not strategy:
            raise ValueError("Strategy not found")
        strategy.status = status
        return strategy

    async def run_once(self, db: AsyncSession, user: User, strategy_id: uuid.UUID) -> StrategyRun:
        result = await db.execute(
            select(Strategy).where(Strategy.id == strategy_id, Strategy.user_id == user.id)
        )
        strategy = result.scalar_one_or_none()
        if not strategy:
            raise ValueError("Strategy not found")

        rules = json.loads(strategy.rules_json or "{}")
        side = rules.get("action", "BUY")
        qty = min(int(rules.get("qty", 1)), strategy.max_quantity)

        run = StrategyRun(strategy_id=strategy.id, status="RUNNING")
        db.add(run)
        await db.flush()

        order = await order_service.place_order(
            db,
            user,
            PlaceOrderRequest(
                symbol=strategy.symbol,
                side=side if side in ("BUY", "SELL") else "BUY",
                quantity=qty,
                paper_mode=strategy.paper_mode,
                broker="paper" if strategy.paper_mode else "dhan",
            ),
            source="strategy",
            strategy_id=strategy.id,
        )
        run.status = "COMPLETED" if order.status in ("PAPER_FILLED", "FILLED", "PENDING") else "FAILED"
        run.notes = f"Order {order.id} status={order.status}"
        return run


strategy_service = StrategyService()
