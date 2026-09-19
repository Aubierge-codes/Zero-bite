from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta

from database.session import get_db
from database.models import Alert, RiskZone, FieldTeam, Prediction, ActivityLog

router = APIRouter()


@router.get("/stats")
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)

    zones_r = await db.execute(select(RiskZone))
    all_zones = zones_r.scalars().all()

    alerts_r = await db.execute(select(Alert).where(Alert.status == "active", Alert.created_at >= day_ago))
    active_alerts = alerts_r.scalars().all()

    teams_r = await db.execute(select(FieldTeam))
    teams = teams_r.scalars().all()

    pred_r = await db.execute(select(Prediction).order_by(Prediction.created_at.desc()))
    latest_pred = pred_r.scalars().first()

    return {
        "timestamp": now.isoformat(),
        "risk_zones": {
            "total": len(all_zones),
            "high": sum(1 for z in all_zones if z.risk_level == "HIGH"),
            "moderate": sum(1 for z in all_zones if z.risk_level == "MODERATE"),
            "low": sum(1 for z in all_zones if z.risk_level == "LOW"),
        },
        "alerts": {
            "active_24h": len(active_alerts),
            "high": sum(1 for a in active_alerts if a.risk_level == "HIGH"),
            "moderate": sum(1 for a in active_alerts if a.risk_level == "MODERATE"),
        },
        "field_ops": {
            "total_teams": len(teams),
            "deployed_teams": sum(1 for t in teams if t.status == "deployed"),
            "sites_treated_7d": 91,
            "larvicide_saved_pct": 62,
        },
        "prediction": {
            "last_run": latest_pred.created_at.isoformat() if latest_pred else None,
            "model_version": latest_pred.model_version if latest_pred else "v2.4",
            "lead_time_hours": 24,
        },
    }


@router.get("/activity-log")
async def activity_log(limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit)
    )
    logs = result.scalars().all()
    return [{"id": str(l.id), "event_type": l.event_type,
             "description": l.description, "created_at": l.created_at} for l in logs]
