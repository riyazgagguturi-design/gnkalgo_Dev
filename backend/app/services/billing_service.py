from datetime import datetime, timedelta, timezone
from urllib.parse import quote, urlencode

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import generate_secure_token
from app.models import Payment, Subscription, User

PLANS = [
    {"code": "DAILY", "name": "Daily", "days": 1, "amount_inr": 199, "label": "₹199 / 1 day"},
    {"code": "5DAYS", "name": "5 Days", "days": 5, "amount_inr": 999, "label": "₹999 / 5 days"},
    {"code": "22DAYS", "name": "22 Days", "days": 22, "amount_inr": 1999, "label": "₹1,999 / 22 days"},
]


def get_plan(code: str) -> dict:
    for plan in PLANS:
        if plan["code"] == code:
            return plan
    raise ValueError("Unknown plan")


def upi_payload(amount: int, reference: str, note: str) -> str:
    params = {
        "pa": settings.upi_vpa,
        "pn": settings.upi_payee_name,
        "am": str(amount),
        "cu": "INR",
        "tn": note,
        "tr": reference,
    }
    return urlencode(params, quote_via=quote)


def upi_intents(amount: int, reference: str) -> dict:
    qs = upi_payload(amount, reference, f"GNK ALGO {reference}")
    return {
        "upi": f"upi://pay?{qs}",
        "gpay": f"tez://upi/pay?{qs}",
        "phonepe": f"phonepe://pay?{qs}",
        "paytm": f"paytmmp://pay?{qs}",
        "vpa": settings.upi_vpa,
        "payee": settings.upi_payee_name,
        "amount": amount,
        "reference": reference,
    }


async def active_subscription(db: AsyncSession, user: User) -> Subscription | None:
    result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = result.scalar_one_or_none()
    if not sub:
        return None
    if sub.expires_at.replace(tzinfo=sub.expires_at.tzinfo or timezone.utc) < datetime.now(timezone.utc):
        return None
    return sub


async def create_payment(db: AsyncSession, user: User, plan_code: str) -> tuple[Payment, dict]:
    plan = get_plan(plan_code)
    reference = f"GNK{generate_secure_token()[:10].upper()}"
    payment = Payment(
        user_id=user.id,
        plan_code=plan["code"],
        amount_inr=plan["amount_inr"],
        days=plan["days"],
        reference=reference,
        status="pending",
        upi_vpa=settings.upi_vpa,
    )
    db.add(payment)
    await db.flush()
    return payment, upi_intents(plan["amount_inr"], reference)


async def submit_utr(db: AsyncSession, user: User, payment_id, utr: str) -> Payment:
    result = await db.execute(select(Payment).where(Payment.id == payment_id, Payment.user_id == user.id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise ValueError("Payment not found")
    if payment.status == "confirmed":
        raise ValueError("Already confirmed")
    payment.utr = utr.strip()
    payment.status = "submitted"
    return payment


async def confirm_payment(db: AsyncSession, payment_id) -> Payment:
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise ValueError("Payment not found")
    now = datetime.now(timezone.utc)
    payment.status = "confirmed"
    payment.confirmed_at = now

    existing = await db.execute(select(Subscription).where(Subscription.user_id == payment.user_id))
    sub = existing.scalar_one_or_none()
    start = now
    if sub and sub.expires_at.replace(tzinfo=sub.expires_at.tzinfo or timezone.utc) > now:
        start = sub.expires_at.replace(tzinfo=sub.expires_at.tzinfo or timezone.utc)
    expires = start + timedelta(days=payment.days)
    if sub:
        sub.plan_code = payment.plan_code
        sub.starts_at = start
        sub.expires_at = expires
    else:
        db.add(
            Subscription(
                user_id=payment.user_id,
                plan_code=payment.plan_code,
                starts_at=start,
                expires_at=expires,
            )
        )
    return payment
