from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


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
    price: float | None
    status: str
    broker: str
    source: str
    message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class StrategyCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = None
    symbol: str = "RELIANCE"
    rules_json: str = "{}"
    paper_mode: bool = True
    max_quantity: int = 100
    max_daily_loss: float = 5000


class StrategyResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    symbol: str
    status: str
    paper_mode: bool
    max_quantity: int
    max_daily_loss: float
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
