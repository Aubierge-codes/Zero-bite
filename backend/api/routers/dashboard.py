from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta

from database.session import get_db
from database.models import Alert, RiskZone, FieldTeam, Prediction, ActivityLog, TreatmentRecord
from ml.refresh import ensure_fresh
from ml.runtime import predictor

router = APIRouter()


@router.get("/stats")
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    await ensure_fresh(db)
    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)

    all_zones = (await db.execute(select(RiskZone))).scalars().all()
    active_alerts = (await db.execute(
        select(Alert).where(Alert.status == "active", Alert.created_at >= day_ago)
    )).scalars().all()
    teams = (await db.execute(select(FieldTeam))).scalars().all()
    latest_pred = (await db.execute(
        select(Prediction).order_by(Prediction.created_at.desc())
    )).scalars().first()

    treated = (await db.execute(
        select(TreatmentRecord).where(TreatmentRecord.treated_at >= week_ago)
    )).scalars().all()
    measured = [r for r in treated if r.larvae_count_before and r.larvae_count_after is not None]
    larvae_reduction = (
        round(sum((r.larvae_count_before - r.larvae_count_after) / r.larvae_count_before
                  for r in measured) / len(measured) * 100)
        if measured else None
    )

    def n(level): return sum(1 for z in all_zones if z.risk_level == level)

    return {
        "timestamp": now.isoformat(),
        "risk_zones": {
            "total": len(all_zones),
            "critical": n("CRITICAL"), "high": n("HIGH"), "moderate": n("MODERATE"), "low": n("LOW"),
        },
        "alerts": {
            "active_24h": len(active_alerts),
            "high": sum(1 for a in active_alerts if a.risk_level == "HIGH"),
            "moderate": sum(1 for a in active_alerts if a.risk_level == "MODERATE"),
        },
        "field_ops": {
            "total_teams": len(teams),
            "deployed_teams": sum(1 for t in teams if t.status == "deployed"),
            "sites_treated_7d": len(treated),
            "larvicide_saved_pct": larvae_reduction,   # measured larvae reduction; null until field data exists
        },
        "prediction": {
            "last_run": latest_pred.created_at.isoformat() if latest_pred else None,
            "model_version": latest_pred.model_version if latest_pred else predictor.model_version,
            "lead_time_hours": 24,
        },
    }


@router.get("/activity-log")
async def activity_log(limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit)
    )
    return [{"id": str(l.id), "event_type": l.event_type,
             "description": l.description, "created_at": l.created_at}
            for l in result.scalars().all()]
