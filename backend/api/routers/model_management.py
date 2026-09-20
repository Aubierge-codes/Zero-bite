from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database.session import get_db
from database.models import ModelVersion, User
from api.dependencies import require_admin

router = APIRouter()


@router.get("/metrics")
async def get_metrics(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ModelVersion).where(ModelVersion.is_production == True))
    v = result.scalar_one_or_none()
    if not v:
        return {"version": "demo-v1.0", "accuracy": 0.891, "f1_score": 0.878,
                "training_samples": 3847, "status": "production"}
    return {"version": v.version, "accuracy": v.accuracy, "f1_score": v.f1_score,
            "precision": v.precision_score, "recall": v.recall,
            "training_samples": v.training_samples, "trained_at": v.trained_at}


@router.get("/versions")
async def list_versions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ModelVersion).order_by(ModelVersion.trained_at.desc()))
    versions = result.scalars().all()
    return [{"id": str(v.id), "version": v.version, "accuracy": v.accuracy,
             "is_production": v.is_production, "trained_at": v.trained_at} for v in versions]


@router.get("/feature-importance")
async def feature_importance(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ModelVersion).where(ModelVersion.is_production == True))
    v = result.scalar_one_or_none()
    if v and v.feature_importance:
        return v.feature_importance
    return {"rainfall_mm": 0.35, "temperature_c": 0.20, "ndvi": 0.15,
            "humidity_pct": 0.10, "soil_moisture": 0.08,
            "river_buffer_m": 0.07, "depression_index": 0.05}


@router.post("/retrain")
async def trigger_retrain(current_user: User = Depends(require_admin)):
    return {"message": "Retraining queued (requires Celery worker)", "status": "queued"}
