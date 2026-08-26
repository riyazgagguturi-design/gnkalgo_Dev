from contextlib import asynccontextmanager

import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from sqlalchemy import text

from app.api.admin import router as admin_router
from app.api.auth import brokers_router, router as auth_router
from app.api.billing import router as billing_router
from app.api.dashboard import router as dashboard_router
from app.api.orders import router as orders_router
from app.api.signals import router as signals_router
from app.api.strategies import router as strategies_router
from app.api.webhooks import router as webhooks_router
from app.config import settings
from app.database import Base, engine
from app.models import billing as _billing_models  # noqa: F401
from app.models import trading as _trading_models  # noqa: F401
from app.models import user as _user_models  # noqa: F401

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


def _add_user_columns(sync_conn):
    dialect = sync_conn.dialect.name
    if dialect == "sqlite":
        cols = {row[1] for row in sync_conn.exec_driver_sql("PRAGMA table_info(users)")}
        if "last_login_at" not in cols:
            sync_conn.exec_driver_sql("ALTER TABLE users ADD COLUMN last_login_at DATETIME")
        if "is_admin" not in cols:
            sync_conn.exec_driver_sql("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
        return
    sync_conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ")
    sync_conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE")


def _add_strategy_columns(sync_conn):
    dialect = sync_conn.dialect.name
    if dialect == "sqlite":
        cols = {row[1] for row in sync_conn.exec_driver_sql("PRAGMA table_info(strategies)")}
        if "schedule_enabled" not in cols:
            sync_conn.exec_driver_sql("ALTER TABLE strategies ADD COLUMN schedule_enabled BOOLEAN DEFAULT 0")
        if "interval_minutes" not in cols:
            sync_conn.exec_driver_sql("ALTER TABLE strategies ADD COLUMN interval_minutes INTEGER DEFAULT 0")
        if "last_scheduled_run_at" not in cols:
            sync_conn.exec_driver_sql("ALTER TABLE strategies ADD COLUMN last_scheduled_run_at DATETIME")
        return
    sync_conn.exec_driver_sql(
        "ALTER TABLE strategies ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN DEFAULT FALSE"
    )
    sync_conn.exec_driver_sql(
        "ALTER TABLE strategies ADD COLUMN IF NOT EXISTS interval_minutes INTEGER DEFAULT 0"
    )
    sync_conn.exec_driver_sql(
        "ALTER TABLE strategies ADD COLUMN IF NOT EXISTS last_scheduled_run_at TIMESTAMPTZ"
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.services.strategy_scheduler import start_strategy_scheduler

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_add_user_columns)
        await conn.run_sync(_add_strategy_columns)
    scheduler_task = start_strategy_scheduler()
    yield
    scheduler_task.cancel()
    try:
        await scheduler_task
    except asyncio.CancelledError:
        pass
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
    app.include_router(billing_router, prefix=prefix)
    app.include_router(admin_router, prefix=prefix)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "gnkalgo-backend", "version": "0.1.0"}
