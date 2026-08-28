from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class StrategyRules(BaseModel):
    action: Literal["BUY", "SELL"] = "BUY"
    qty: int = Field(default=1, gt=0, le=10000)


class PlaceOrderRequest(BaseModel):
    symbol: str = Field(min_length=1, max_length=32)
    exchange: str = "NSE"
    side: Literal["BUY", "SELL"]
    quantity: int = Field(gt=0, le=10000)
    order_type: Literal["MARKET", "LIMIT"] = "MARKET"
    price: float | None = None
    product_type: str = "INTRADAY"
    broker: Literal["dhan", "groww", "paper"] = "paper"
    paper_mode: bool = True
    correlation_id: str | None = None


class OrderResponse(BaseModel):
    id: UUID
    symbol: str
    exchange: str
    side: str
    quantity: int
    order_type: str
    product_type: str = "INTRADAY"
    price: float | None
    status: str
    broker: str
    broker_order_id: str | None = None
    source: str
    message: str | None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class StrategyCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = None
    symbol: str = "RELIANCE"
    rules_json: str | None = None
    action: Literal["BUY", "SELL"] | None = None
    qty: int | None = Field(default=None, gt=0, le=10000)
    paper_mode: bool = True
    max_quantity: int = Field(default=100, gt=0, le=10000)
    max_daily_loss: float = 5000
    schedule_enabled: bool = False
    interval_minutes: int = Field(default=0, ge=0, le=1440)

    @model_validator(mode="after")
    def interval_when_scheduled(self):
        if self.schedule_enabled and self.interval_minutes < 1:
            raise ValueError("interval_minutes must be at least 1 when schedule is enabled")
        return self


class StrategyUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = None
    symbol: str | None = None
    rules_json: str | None = None
    action: Literal["BUY", "SELL"] | None = None
    qty: int | None = Field(default=None, gt=0, le=10000)
    paper_mode: bool | None = None
    max_quantity: int | None = Field(default=None, gt=0, le=10000)
    max_daily_loss: float | None = None
    schedule_enabled: bool | None = None
    interval_minutes: int | None = Field(default=None, ge=0, le=1440)
    status: Literal["DRAFT", "PAPER", "LIVE", "PAUSED"] | None = None


class StrategyResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    symbol: str
    rules_json: str
    status: str
    paper_mode: bool
    max_quantity: int
    max_daily_loss: float
    schedule_enabled: bool
    interval_minutes: int
    last_scheduled_run_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class WebhookCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    direction: Literal["INBOUND", "OUTBOUND"]
    target_url: str | None = None


class WebhookResponse(BaseModel):
    id: UUID
    name: str
    direction: str
    token: str
    is_active: bool
    target_url: str | None
    inbound_url: str | None = None
    secret: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class InboundWebhookPayload(BaseModel):
    symbol: str
    action: Literal["BUY", "SELL"]
    qty: int = Field(gt=0, le=10000)
    price: float | None = None
    paper_mode: bool = True


class SignalResponse(BaseModel):
    id: UUID
    symbol: str
    action: str
    confidence: float
    price: float | None
    model_version: str
    created_at: datetime
    disclaimer: str = "Not investment advice. For educational purposes only."

    model_config = {"from_attributes": True}
