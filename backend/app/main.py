from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.auth import brokers_router, router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.orders import router as orders_router
from app.api.signals import router as signals_router
from app.api.strategies import router as strategies_router
from app.api.webhooks import router as webhooks_router
from app.config import settings
from app.database import Base, engine
from app.models import trading as _trading_models  # noqa: F401
from app.models import user as _user_models  # noqa: F401

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="GnKAlgo API",
    description="Indian Algo Trading Platform API — www.gnkalgo.com",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_origin_regex=r"https://([a-z0-9-]+\.)?gnkalgo\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"
for prefix in (API_PREFIX, "/v1"):
    app.include_router(auth_router, prefix=prefix)
    app.include_router(brokers_router, prefix=prefix)
    app.include_router(dashboard_router, prefix=prefix)
    app.include_router(orders_router, prefix=prefix)
    app.include_router(strategies_router, prefix=prefix)
    app.include_router(signals_router, prefix=prefix)
    app.include_router(webhooks_router, prefix=prefix)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "gnkalgo-backend", "version": "0.1.0"}
