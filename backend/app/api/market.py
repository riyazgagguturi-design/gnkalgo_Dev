from fastapi import APIRouter

from app.services.market_service import get_indices, market_session

router = APIRouter(prefix="/market", tags=["Market"])


@router.get("/indices")
async def market_indices():
    return get_indices()


@router.get("/status")
async def market_status():
    return market_session()
