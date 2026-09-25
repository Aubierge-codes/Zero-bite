"""
Alerts Router
Serves alert inbox, compose, broadcast SMS, and templates.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

from database.session import get_db
from database.models import Alert, ActivityLog, SmsLog, SmsSubscriber, User
from api.config import get_settings
from api.dependencies import require_admin
from data_pipeline.rwanda_districts import canonical_district
from alerts.sms_broadcast import normalize_rw_phone, sms_delivered as _sms_delivered, subscribers as _subscribers, broadcast as _broadcast, log_sms
from alerts.notification_service import send_sms
from alerts.schemas import AlertAcknowledgeRequest, CommunitySmsRequest, AlertResolveRequest

router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────────────────────

class ComposeAlertRequest(BaseModel):
    message:          str
    delivery_channels: List[str] = ["dashboard"]   # dashboard, sms
    target_audience:  str = "all"
    geographic_scope: List[str] = []               # district names
    risk_level:       str = "HIGH"


class SmsSubscribeRequest(BaseModel):
    phone_number: str
    district:     str
    name:         Optional[str] = None



# ── Alert inbox ────────────────────────────────────────────────────────────────

@router.get("/")
async def list_alerts(
    risk_level: Optional[str] = Query(None),
    status:     Optional[str] = Query(None),
    hours:      int           = Query(720),
    district:   Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Screen 6 — Alerts inbox list with filters."""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    stmt   = select(Alert).where(Alert.created_at >= cutoff)

    if risk_level: stmt = stmt.where(Alert.risk_level == risk_level.upper())
    if status:     stmt = stmt.where(Alert.status == status)
    if district:   stmt = stmt.where(Alert.region == district)

    stmt   = stmt.order_by(Alert.created_at.desc())
    result = await db.execute(stmt)
    alerts = result.scalars().all()

    return [
        {
            "id":             str(a.id),
            "risk_level":     a.risk_level,
            "region":         a.region,
            "site_name":      a.site_name,
            "trigger_reason": a.trigger_reason,
            "status":         a.status,
            "created_at":     a.created_at,
        }
        for a in alerts
    ]


@router.get("/stats/summary")
async def alert_summary(days: int = 7, db: AsyncSession = Depends(get_db)):
    """Dashboard stat cards — alert counts by level and status."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(select(Alert).where(Alert.created_at >= cutoff))
    alerts = result.scalars().all()
    return {
        "total":    len(alerts),
        "critical": sum(1 for a in alerts if a.risk_level == "CRITICAL"),
        "high":     sum(1 for a in alerts if a.risk_level == "HIGH"),
        "moderate": sum(1 for a in alerts if a.risk_level == "MODERATE"),
        "low":      sum(1 for a in alerts if a.risk_level == "LOW"),
        "active":   sum(1 for a in alerts if a.status == "active"),
        "resolved": sum(1 for a in alerts if a.status == "resolved"),
    }


# ── Alert compose + broadcast ──────────────────────────────────────────────────

@router.post("/compose")
async def compose_alert(
    payload: ComposeAlertRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Screen 6 — Alert Composer.
    Saves alert to DB and optionally broadcasts via SMS.
    """
    results = {"dashboard": False, "sms": False, "sms_recipients": 0, "sms_sent": 0, "sms_errors": []}

    districts = [canonical_district(d) or d for d in (payload.geographic_scope or [])]

    # Save to DB for dashboard delivery
    for district in (districts or ["Rwanda"]):
        db.add(Alert(
            risk_level=payload.risk_level.upper(),
            region=district,
            trigger_reason=payload.message,
            status="active",
        ))
    db.add(ActivityLog(event_type="alert_broadcast",
                       description=f"Alert composed for {', '.join(districts) or 'Rwanda'} via {', '.join(payload.delivery_channels)}"))
    await db.commit()
    results["dashboard"] = True

    # SMS to the real subscribers of the targeted districts
    if "sms" in payload.delivery_channels:
        subs = await _subscribers(db, districts)
        outcome = await _broadcast(subs, payload.message, db)
        results["sms_recipients"] = outcome["recipients"]
        results["sms_sent"] = outcome["sent"]
        results["sms_errors"] = outcome["errors"]
        results["sms"] = outcome["sent"] > 0
        if not subs:
            results["sms_errors"] = ["No subscribers registered for the selected districts yet."]

    return {
        "message":   "Alert composed and saved",
        "channels":  payload.delivery_channels,
        "districts": districts,
        "results":   results,
    }


@router.post("/broadcast-sms")
async def broadcast_community_sms(payload: CommunitySmsRequest, db: AsyncSession = Depends(get_db)):
    """
    Screen 4 — Community Worker 'Send Community SMS' button.
    Sends the message to every subscribed phone in the district.
    """
    district = canonical_district(payload.district) or payload.district
    subs = await _subscribers(db, [district])
    if not subs:
        raise HTTPException(status_code=404, detail=f"No SMS subscribers registered in {district} yet.")
    outcome = await _broadcast(subs, payload.message, db)
    if outcome["sent"] == 0:
        raise HTTPException(
            status_code=502,
            detail=f"SMS not delivered: {outcome['errors'][0] if outcome['errors'] else 'gateway error'}",
        )
    return {
        "message":    f"SMS delivered to {outcome['sent']} of {outcome['recipients']} subscribers",
        "district":   district,
        "zone_id":    payload.zone_id,
        "recipients": outcome["recipients"],
        "sent":       outcome["sent"],
    }


@router.get("/subscribers/count")
async def subscriber_count(district: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """Number of active SMS subscribers (optionally for one district)."""
    d = canonical_district(district) if district else None
    subs = await _subscribers(db, [d] if d else [])
    return {"district": d, "count": len(subs)}


@router.post("/subscribe-sms")
async def subscribe_sms(payload: SmsSubscribeRequest, db: AsyncSession = Depends(get_db)):
    """
    Screen 5 — Public portal 'Stay Protected' SMS subscription.
    Stores the subscription and sends a confirmation SMS when the gateway is configured.
    """
    district = canonical_district(payload.district)
    if not district:
        raise HTTPException(status_code=422, detail=f"Unknown district '{payload.district}'")
    phone = normalize_rw_phone(payload.phone_number)
    if not phone:
        raise HTTPException(status_code=422, detail="Enter a valid Rwandan mobile number (e.g. 078XXXXXXX).")

    existing = (await db.execute(
        select(SmsSubscriber).where(SmsSubscriber.phone == phone, SmsSubscriber.district == district)
    )).scalar_one_or_none()
    if existing:
        existing.is_active = True
        if payload.name:
            existing.name = payload.name
    else:
        db.add(SmsSubscriber(phone=phone, district=district, name=payload.name))
    await db.commit()

    response = await send_sms(
        phone=phone,
        message=(f"Zero Bite: You are now subscribed to malaria risk alerts for {district}. "
                 "Reply STOP to unsubscribe."),
    )
    confirmation = await log_sms(db, phone, "subscription confirmation", response, district)
    await db.commit()
    return {
        "message":  "Subscribed to SMS alerts",
        "district": district,
        "phone":    phone,
        "confirmation_sms_sent": confirmation == "delivered",
    }


# ── Templates ──────────────────────────────────────────────────────────────────

@router.get("/templates")
async def alert_templates():
    """Screen 6 — Alert Composer templates list."""
    return [
        {
            "id":       "malaria-high",
            "name":     "Malaria Risk Spike",
            "message":  "ALERT: High malaria breeding risk detected in {district}. All Abajyanama b'ubuzima: conduct immediate stagnant water removal campaigns. Contact district office for support.",
            "channel":  ["dashboard", "sms"],
            "audience": "community_workers",
        },
        {
            "id":       "flood-warning",
            "name":     "Flood Warning",
            "message":  "FLOOD WARNING: Heavy rainfall forecast for {district} in next 48 hours. Evacuate low-lying areas. Avoid river crossing.",
            "channel":  ["dashboard", "sms"],
            "audience": "all",
        },
        {
            "id":       "monthly-briefing",
            "name":     "Monthly Health Briefing",
            "message":  "Zero Bite Monthly Update for {district}: Risk level this month is {risk_level}. Key actions: {actions}.",
            "channel":  ["dashboard"],
            "audience": "district_officers",
        },
        {
            "id":       "critical-escalation",
            "name":     "Critical Escalation",
            "message":  "CRITICAL: Imminent outbreak risk in {district}. Risk score {score}/100. Ministry of Health escalation required. All response channels activated.",
            "channel":  ["dashboard", "sms"],
            "audience": "ministry",
        },
    ]


# ── Alert lifecycle ────────────────────────────────────────────────────────────

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    payload: AlertAcknowledgeRequest = AlertAcknowledgeRequest(),
    db: AsyncSession = Depends(get_db),
):
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status         = "acknowledged"
    alert.acknowledged_at = datetime.utcnow()
    if payload.notes:
        alert.response_notes = payload.notes
    if payload.assigned_team_id:
        alert.assigned_team_id = payload.assigned_team_id
    await db.commit()
    return {"message": "Alert acknowledged", "alert_id": alert_id}


@router.post("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    payload: AlertResolveRequest = AlertResolveRequest(),
    db: AsyncSession = Depends(get_db),
):
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status         = "resolved"
    alert.resolved_at    = datetime.utcnow()
    alert.response_notes = payload.response_notes
    await db.commit()
    return {"message": "Alert resolved", "alert_id": alert_id}


# ── Test SMS ───────────────────────────────────────────────────────────────────

@router.post("/test-sms")
async def test_sms(
    phone:   str,
    message: str = "Zero_Bite test alert: High mosquito risk detected.",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin tool to verify the SMS gateway is working."""
    number = normalize_rw_phone(phone) or phone
    response = await send_sms(number, message)
    status = await log_sms(db, number, message, response)
    db.add(ActivityLog(event_type="sms_test", description=f"Test SMS to {number}: {status} (by {current_user.email})"))
    await db.commit()
    return {"message": f"Test SMS {status}", "status": status, "provider_response": response}


@router.get("/sms/status")
async def sms_status(db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin)):
    """Real SMS gateway configuration + delivery statistics (last 7 days)."""
    s = get_settings()
    key = s.africastalking_api_key
    week_ago = datetime.utcnow() - timedelta(days=7)
    rows = (await db.execute(select(SmsLog.status, func.count()).where(SmsLog.created_at >= week_ago)
                             .group_by(SmsLog.status))).all()
    counts = {status: n for status, n in rows}
    attempted = sum(counts.values())
    subs = (await db.execute(select(func.count()).select_from(SmsSubscriber)
                             .where(SmsSubscriber.is_active == True))).scalar_one()  # noqa: E712
    return {
        "configured":   bool(key),
        "provider":     "Africa's Talking",
        "username":     s.africastalking_username,
        "sandbox":      s.africastalking_username == "sandbox",
        "sender_id":    s.AT_SENDER_ID,
        "api_key_hint": f"••••{key[-4:]}" if key else None,
        "delivered_7d": counts.get("delivered", 0),
        "failed_7d":    counts.get("failed", 0) + counts.get("skipped", 0),
        "delivery_rate_7d": round(counts.get("delivered", 0) / attempted * 100, 1) if attempted else None,
        "subscribers":  subs,
    }


@router.get("/sms/log")
async def sms_log(limit: int = 20, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin)):
    rows = (await db.execute(select(SmsLog).order_by(SmsLog.created_at.desc()).limit(limit))).scalars().all()
    return [{"id": r.id, "phone": r.phone, "district": r.district, "status": r.status,
             "detail": r.detail, "created_at": r.created_at} for r in rows]
