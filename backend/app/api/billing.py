from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.deps import get_current_user
from app.database import get_db
from app.models import User
from app.services import billing_service

router = APIRouter(prefix="/billing", tags=["Billing"])


class CreatePaymentRequest(BaseModel):
    plan_code: str


class SubmitUtrRequest(BaseModel):
    utr: str = Field(min_length=6, max_length=64)


@router.get("/plans")
async def list_plans():
    return {
        "share_url": f"{settings.frontend_url.rstrip('/')}/subscribe",
        "upi_vpa": settings.upi_vpa,
        "plans": billing_service.PLANS,
    }


@router.get("/me")
async def my_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sub = await billing_service.active_subscription(db, current_user)
    if not sub:
        return {"active": False, "subscription": None}
    return {
        "active": True,
        "subscription": {
            "plan_code": sub.plan_code,
            "expires_at": sub.expires_at,
        },
    }


@router.post("/checkout")
async def checkout(
    data: CreatePaymentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        payment, intents = await billing_service.create_payment(db, current_user, data.plan_code.upper())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {
        "payment_id": str(payment.id),
        "reference": payment.reference,
        "amount_inr": payment.amount_inr,
        "days": payment.days,
        "plan_code": payment.plan_code,
        "plan_label": billing_service.get_plan(payment.plan_code)["label"],
        "intents": intents,
        "support_email": settings.support_email,
        "admin_url": f"{settings.frontend_url.rstrip('/')}/admin",
        "instructions": (
            "1. Pay exact amount via PhonePe, GPay, or Paytm. "
            "2. Copy UTR / UPI Ref No. from the app. "
            "3. Submit below. Access starts after admin confirms at /admin."
        ),
    }


@router.post("/payments/{payment_id}/utr")
async def submit_utr(
    payment_id: UUID,
    data: SubmitUtrRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        payment = await billing_service.submit_utr(db, current_user, payment_id, data.utr)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"status": payment.status, "message": "UTR submitted. Access starts after admin confirmation."}
