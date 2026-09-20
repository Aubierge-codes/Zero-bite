"""
Zero_Bite — AI Predictive Mosquito Control System
Main FastAPI Application
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from loguru import logger

from api.routers import (
    predictions,
    alerts,
    risk_zones,
    field_teams,
    data_ingestion,
    model_management,
    auth,
    dashboard,
)
from database.session import init_db
from api.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Zero_Bite API starting up...")
    await init_db()
    logger.info("Database initialized")
    yield
    logger.info("Zero_Bite API shutting down...")


app = FastAPI(
    title="Zero_Bite API",
    description="AI-powered mosquito breeding site prediction and control system for Rwanda",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router,             prefix="/api/v1/auth",        tags=["Authentication"])
app.include_router(dashboard.router,        prefix="/api/v1/dashboard",   tags=["Dashboard"])
app.include_router(predictions.router,      prefix="/api/v1/predictions", tags=["Predictions"])
app.include_router(alerts.router,           prefix="/api/v1/alerts",      tags=["Alerts"])
app.include_router(risk_zones.router,       prefix="/api/v1/risk-zones",  tags=["Risk Zones"])
app.include_router(field_teams.router,      prefix="/api/v1/field-teams", tags=["Field Teams"])
app.include_router(data_ingestion.router,   prefix="/api/v1/data",        tags=["Data Ingestion"])
app.include_router(model_management.router, prefix="/api/v1/model",       tags=["Model Management"])


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Catches anything that escapes a router's own error handling so the
    frontend always gets a consistent JSON error shape instead of an
    inconsistent 500 (or a raw traceback, depending on what raised it).
    """
    logger.exception(f"Unhandled error on {request.method} {request.url.path}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again or contact support if it persists."},
    )


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status":      "healthy",
        "service":     "Zero_Bite API",
        "version":     "1.0.0",
        "environment": settings.APP_ENV,
    }