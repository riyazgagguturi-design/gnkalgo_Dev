from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database import get_db
from app.models import User
from app.schemas.trading import StrategyCreateRequest, StrategyResponse
from app.services.strategy_service import strategy_service

router = APIRouter(prefix="/strategies", tags=["Strategies"])


@router.get("/", response_model=list[StrategyResponse])
async def list_strategies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await strategy_service.list_strategies(db, current_user)


@router.post("/", response_model=StrategyResponse)
async def create_strategy(
    data: StrategyCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await strategy_service.create(db, current_user, data)


@router.post("/{strategy_id}/status")
async def update_status(
    strategy_id: UUID,
    status: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        strategy = await strategy_service.set_status(db, current_user, strategy_id, status)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return strategy


@router.post("/{strategy_id}/run")
async def run_strategy(
    strategy_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        run = await strategy_service.run_once(db, current_user, strategy_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return {"run_id": str(run.id), "status": run.status, "notes": run.notes}
