"""
Alerts Router
Serves alert inbox, compose, broadcast SMS, and templates.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

from database.session import get_db
from database.models import Alert
from alerts.notification_service import send_sms

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
    results = {"dashboard": False, "sms": False, "sms_errors": []}

    # Save to DB for dashboard delivery
    for district in (payload.geographic_scope or ["Rwanda"]):
        alert = Alert(
            risk_level=payload.risk_level,
            region=district,
            trigger_reason=payload.message,
            status="active",
        )
        db.add(alert)
    await db.commit()
    results["dashboard"] = True

    # SMS broadcast if requested
    if "sms" in payload.delivery_channels and payload.geographic_scope:
        for district in payload.geographic_scope:
            try:
                await send_sms(
                    phone=f"+250000000000",   # replaced by real contact lookup in production
                    message=payload.message,
                    district=district,
                )
                results["sms"] = True
            except Exception as e:
                results["sms_errors"].append(str(e))

    return {
        "message":   "Alert composed and sent",
        "channels":  payload.delivery_channels,
        "districts": payload.geographic_scope,
        "results":   results,
    }


@router.post("/broadcast-sms")
async def broadcast_community_sms(
    message:  str,
    district: str,
    zone_id:  Optional[str] = None,
):
    """
    Screen 4 — Community Worker 'Send Community SMS' button.
    Sends SMS to all contacts in a zone/district.
    """
    try:
        response = await send_sms(
            phone="+250000000000",
            message=message,
            district=district,
        )
        return {
            "message":  "SMS broadcast sent",
            "district": district,
            "zone_id":  zone_id,
            "response": response,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SMS failed: {e}")


@router.post("/subscribe-sms")
async def subscribe_sms(payload: SmsSubscribeRequest):
    """
    Screen 5 — Public portal 'Stay Protected' SMS subscription.
    Subscribes a phone number to weekly district risk alerts.
    """
    try:
        response = await send_sms(
            phone=payload.phone_number,
            message=(
                f"Zero Bite: You are now subscribed to weekly malaria risk "
                f"alerts for {payload.district}. "
                f"Reply STOP to unsubscribe."
            ),
        )
        return {
            "message":  "Subscribed to weekly SMS alerts",
            "district": payload.district,
            "phone":    payload.phone_number,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Subscription failed: {e}")


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
async def acknowledge_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status         = "acknowledged"
    alert.acknowledged_at = datetime.utcnow()
    await db.commit()
    return {"message": "Alert acknowledged", "alert_id": alert_id}


@router.post("/{alert_id}/resolve")
async def resolve_alert(
    alert_id:      str,
    response_notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status         = "resolved"
    alert.resolved_at    = datetime.utcnow()
    alert.response_notes = response_notes
    await db.commit()
    return {"message": "Alert resolved", "alert_id": alert_id}


# ── Test SMS ───────────────────────────────────────────────────────────────────

@router.post("/test-sms")
async def test_sms(
    phone:   str,
    message: str = "Zero_Bite test alert: High mosquito risk detected.",
):
    """Dev/admin tool to verify SMS gateway is working."""
    response = await send_sms(phone, message)
    return {"message": "SMS request processed", "provider_response": response}