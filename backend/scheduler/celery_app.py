"""
Celery Application & Scheduled Tasks
Automates the Zero_Bite data pipeline, predictions, and retraining.

Schedule:
- Every 6 hours:  satellite + weather ingestion
- Every 12 hours: prediction run (6am and 6pm Kigali time)
- Every Monday 2am: model retraining
- Every hour:     alert cleanup
"""

from celery import Celery
from celery.schedules import crontab
from loguru import logger
import asyncio

from api.config import get_settings

settings = get_settings()

celery_app = Celery(
    "zero_bite",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["scheduler.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Kigali",
    enable_utc=True,
    beat_schedule={

        # ── Data ingestion every 6 hours ───────────────────────────────────
        "ingest-satellite-data": {
            "task":     "scheduler.tasks.run_satellite_ingestion",
            "schedule": crontab(minute=0,  hour="*/6"),
        },
        "ingest-weather-data": {
            "task":     "scheduler.tasks.run_weather_ingestion",
            "schedule": crontab(minute=30, hour="*/6"),   # offset 30min from satellite
        },

        # ── AI predictions twice daily (6am + 6pm Kigali) ─────────────────
        "run-predictions": {
            "task":     "scheduler.tasks.run_daily_predictions",
            "schedule": crontab(minute=0, hour="6,18"),
        },

        # ── Weekly model retraining — Monday 2am ──────────────────────────
        # trainer.py will automatically:
        #   1. Load all DB rows accumulated this week
        #   2. Fall back to training_data/dataset_final.csv if DB < 100 rows
        #   3. Retrain XGBoost and promote new model to production
        "retrain-model": {
            "task":     "scheduler.tasks.retrain_model",
            "schedule": crontab(minute=0, hour=2, day_of_week="monday"),
        },

        # ── Hourly stale alert cleanup ─────────────────────────────────────
        "cleanup-alerts": {
            "task":     "scheduler.tasks.cleanup_stale_alerts",
            "schedule": crontab(minute=5),   # 5 past every hour
        },
    },
)


def run_async(coro):
    """Run async coroutines inside synchronous Celery tasks."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()