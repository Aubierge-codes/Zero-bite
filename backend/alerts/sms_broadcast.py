"""
SMS broadcast helpers shared by the alerts router and the prediction refresh.
Recipients are the real phone numbers subscribed through the public portal.
"""

from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from alerts.notification_service import send_sms
from database.models import SmsLog, SmsSubscriber


def normalize_rw_phone(raw: str) -> Optional[str]:
    """Return +2507XXXXXXXX for a Rwandan mobile number, or None if it is not valid."""
    digits = "".join(c for c in raw if c.isdigit())
    if digits.startswith("250") and len(digits) == 12:
        digits = digits[3:]
    elif digits.startswith("0") and len(digits) == 10:
        digits = digits[1:]
    if len(digits) == 9 and digits.startswith("7"):
        return "+250" + digits
    return None


def sms_delivered(response) -> bool:
    """True only if the gateway actually accepted the message (not skipped/failed)."""
    if not isinstance(response, dict):
        return False
    if response.get("status") in ("skipped", "failed"):
        return False
    recipients = response.get("SMSMessageData", {}).get("Recipients", [])
    return bool(recipients) and all(str(r.get("status", "")).lower() == "success" for r in recipients)


async def subscribers(db: AsyncSession, districts: List[str]) -> List[SmsSubscriber]:
    stmt = select(SmsSubscriber).where(SmsSubscriber.is_active == True)  # noqa: E712
    if districts:
        stmt = stmt.where(SmsSubscriber.district.in_(districts))
    return (await db.execute(stmt)).scalars().all()


def sms_outcome(response) -> tuple:
    """(status, detail) for an SMS gateway response."""
    if sms_delivered(response):
        return "delivered", None
    if isinstance(response, dict):
        status = "skipped" if response.get("status") == "skipped" else "failed"
        return status, response.get("reason") or response.get("error") or "gateway rejected the message"
    return "failed", "no response from gateway"


async def log_sms(db: AsyncSession, phone: str, message: str, response, district: Optional[str] = None) -> str:
    status, detail = sms_outcome(response)
    db.add(SmsLog(phone=phone, district=district, message=message, status=status, detail=detail))
    return status


async def broadcast(subs: List[SmsSubscriber], message: str, db: Optional[AsyncSession] = None) -> dict:
    sent, errors = 0, []
    for s in subs:
        response = await send_sms(phone=s.phone, message=message)
        status, detail = sms_outcome(response)
        if db is not None:
            db.add(SmsLog(phone=s.phone, district=s.district, message=message, status=status, detail=detail))
        if status == "delivered":
            sent += 1
        else:
            errors.append(f"{s.phone}: {detail}")
    if db is not None:
        await db.commit()
    return {"recipients": len(subs), "sent": sent, "errors": errors[:5]}
