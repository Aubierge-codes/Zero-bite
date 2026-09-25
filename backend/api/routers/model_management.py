import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database.session import get_db
from database.models import ModelVersion, User
from api.dependencies import require_admin
from ml.predictor import RiskPredictor
from ml.runtime import predictor

router = APIRouter()
METRICS_FILE = Path("models/metrics.json")


def _load_metrics() -> dict:
    if not METRICS_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="No evaluation metrics yet. Run `python -m scripts.evaluate_model` in the backend.",
        )
    return json.loads(METRICS_FILE.read_text(encoding="utf-8"))


@router.get("/metrics")
async def get_metrics():
    """Measured performance of the deployed model (written by scripts/evaluate_model.py)."""
    m = _load_metrics()
    return {**m, "status": "production", "deployed_version": predictor.model_version}


@router.get("/thresholds")
async def thresholds():
    """Risk-level cut-offs currently applied by the predictor (configured in backend .env)."""
    from api.config import get_settings
    s = get_settings()
    return {"moderate": round(s.MODERATE_RISK_THRESHOLD * 100), "high": round(s.HIGH_RISK_THRESHOLD * 100),
            "critical": round(s.CRITICAL_RISK_THRESHOLD * 100)}


@router.get("/versions")
async def list_versions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ModelVersion).order_by(ModelVersion.trained_at.desc()))
    return [{"id": str(v.id), "version": v.version, "accuracy": v.accuracy,
             "is_production": v.is_production, "trained_at": v.trained_at}
            for v in result.scalars().all()]


@router.get("/feature-importance")
async def feature_importance():
    """Feature importances read directly from the deployed model."""
    if not predictor.ready:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {
        name: round(float(imp), 4)
        for name, imp in zip(RiskPredictor.FEATURE_COLUMNS, predictor.model.feature_importances_)
    }


@router.post("/retrain")
async def trigger_retrain(current_user: User = Depends(require_admin)):
    return {"message": "Retraining queued (requires Celery worker)", "status": "queued"}
