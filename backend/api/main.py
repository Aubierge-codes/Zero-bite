"""
Zero_Bite — AI Predictive Mosquito Control System
Main FastAPI Application
"""

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from sqlalchemy import func, select, text

from api.config import get_settings
from api.routers import (
    predictions,
    alerts,
    risk_zones,
    field_teams,
    data_ingestion,
    model_management,
    auth,
    dashboard,
    contact,
    reports,
)
from database.models import RiskZone
from database.session import AsyncSessionLocal, init_db
from ml.feature_extractor import WeatherUnavailable
from ml.predictor import ModelNotAvailable
from ml.refresh import refresh_predictions
from ml.runtime import predictor

settings = get_settings()
settings.validate_for_production()

API_VERSION = "1.1.0"


async def _scheduler_loop():
    """Warm the predictions at startup, then refresh them from live weather on an interval."""
    interval = max(5, settings.REFRESH_INTERVAL_MINUTES) * 60
    while True:
        try:
            async with AsyncSessionLocal() as db:
                await refresh_predictions(db)
        except (ModelNotAvailable, WeatherUnavailable) as exc:
            logger.warning(f"Prediction refresh skipped: {exc}")
        except Exception:
            logger.exception("Prediction refresh failed")
        await asyncio.sleep(interval)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Zero_Bite API {API_VERSION} starting ({settings.APP_ENV})...")
    await init_db()
    logger.info("Database initialized")
    task = asyncio.create_task(_scheduler_loop()) if settings.RUN_SCHEDULER else None
    if task is None:
        logger.info("RUN_SCHEDULER=false — predictions refresh on demand only")
    yield
    if task:
        task.cancel()
    logger.info("Zero_Bite API shutting down...")


app = FastAPI(
    title="Zero_Bite API",
    description="AI-powered mosquito breeding site prediction and control system for Rwanda",
    version=API_VERSION,
    docs_url="/docs" if settings.docs_enabled else None,
    redoc_url="/redoc" if settings.docs_enabled else None,
    openapi_url="/openapi.json" if settings.docs_enabled else None,
    lifespan=lifespan,
)

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    if request.url.path.startswith("/api/"):
        response.headers.setdefault("Cache-Control", "no-store")
    if settings.is_production:
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response


# Routers
app.include_router(auth.router,             prefix="/api/v1/auth",        tags=["Authentication"])
app.include_router(dashboard.router,        prefix="/api/v1/dashboard",   tags=["Dashboard"])
app.include_router(predictions.router,      prefix="/api/v1/predictions", tags=["Predictions"])
app.include_router(alerts.router,           prefix="/api/v1/alerts",      tags=["Alerts"])
app.include_router(risk_zones.router,       prefix="/api/v1/risk-zones",  tags=["Risk Zones"])
app.include_router(field_teams.router,      prefix="/api/v1/field-teams", tags=["Field Teams"])
app.include_router(data_ingestion.router,   prefix="/api/v1/data",        tags=["Data Ingestion"])
app.include_router(contact.router,          prefix="/api/v1/contact",     tags=["Contact"])
app.include_router(reports.router,          prefix="/api/v1/reports",     tags=["Reports"])
app.include_router(model_management.router, prefix="/api/v1/model",       tags=["Model Management"])


@app.exception_handler(WeatherUnavailable)
async def weather_unavailable_handler(request: Request, exc: WeatherUnavailable):
    return JSONResponse(status_code=503, content={"detail": f"Live weather data is unavailable right now: {exc}"})


@app.exception_handler(ModelNotAvailable)
async def model_unavailable_handler(request: Request, exc: ModelNotAvailable):
    return JSONResponse(status_code=503, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Catches anything that escapes a router's own error handling so clients
    always get a consistent JSON error shape instead of a raw traceback.
    """
    logger.exception(f"Unhandled error on {request.method} {request.url.path}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again or contact support if it persists."},
    )


@app.get("/health", tags=["Health"])
async def health_check():
    """Liveness + readiness: database reachable, model loaded, predictions fresh."""
    db_ok, last_refresh = True, None
    try:
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
            last_refresh = (await db.execute(select(func.max(RiskZone.updated_at)))).scalar_one_or_none()
    except Exception as exc:
        logger.error(f"Health check DB error: {exc}")
        db_ok = False

    stale = last_refresh is None or (datetime.utcnow() - last_refresh).total_seconds() > 3 * 3600
    healthy = db_ok and predictor.ready
    body = {
        "status":        "healthy" if healthy else "unhealthy",
        "service":       "Zero_Bite API",
        "version":       API_VERSION,
        "environment":   settings.APP_ENV,
        "database":      "ok" if db_ok else "error",
        "model":         predictor.model_version if predictor.ready else "not loaded",
        "last_refresh":  last_refresh.isoformat() + "Z" if last_refresh else None,
        "predictions":   "stale" if stale else "fresh",
    }
    return JSONResponse(status_code=200 if healthy else 503, content=body)
