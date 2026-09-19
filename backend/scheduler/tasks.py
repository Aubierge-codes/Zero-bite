"""
Celery Tasks
All background and scheduled tasks for Zero_Bite.
"""

from scheduler.celery_app import celery_app, run_async
from loguru import logger


# ── Data Ingestion ─────────────────────────────────────────────────────────────

@celery_app.task(bind=True, max_retries=3, default_retry_delay=300)
def run_satellite_ingestion(self):
    """Scheduled: download and process satellite imagery every 6 hours."""
    try:
        from data_pipeline.satellite_ingestion import SatelliteIngestionPipeline
        pipeline = SatelliteIngestionPipeline()
        run_async(pipeline.run(region="Rwanda"))
        logger.info("Satellite ingestion task completed")
    except Exception as e:
        logger.error(f"Satellite ingestion task failed: {e}")
        raise self.retry(exc=e)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=300)
def run_weather_ingestion(self):
    """Scheduled: pull weather station data every 6 hours."""
    try:
        from data_pipeline.weather_ingestion import WeatherIngestionPipeline
        pipeline = WeatherIngestionPipeline()
        run_async(pipeline.run())
        logger.info("Weather ingestion task completed")
    except Exception as e:
        logger.error(f"Weather ingestion task failed: {e}")
        raise self.retry(exc=e)


# ── Daily Predictions ──────────────────────────────────────────────────────────

@celery_app.task(bind=True, max_retries=2, default_retry_delay=600)
def run_daily_predictions(self):
    """Scheduled: run AI risk predictions twice daily."""
    try:
        from ml.predictor import RiskPredictor
        predictor = RiskPredictor()
        result    = run_async(predictor.predict(
            region="Rwanda",
            prediction_date=__import__("datetime").datetime.utcnow(),
        ))

        logger.info(
            f"Prediction complete — "
            f"CRITICAL={result.critical_risk_count} "
            f"HIGH={result.high_risk_count} "
            f"MODERATE={result.moderate_risk_count} "
            f"LOW={result.low_risk_count}"
        )

        # Generate alerts for HIGH + CRITICAL zones
        from alerts.alert_engine import AlertEngine
        engine = AlertEngine()
        run_async(engine.process_prediction_results("scheduled", result.high_risk_zones))

        _log_activity(
            "prediction_run",
            f"Daily prediction: CRITICAL={result.critical_risk_count} "
            f"HIGH={result.high_risk_count} MODERATE={result.moderate_risk_count}",
        )

    except Exception as e:
        logger.error(f"Prediction task failed: {e}")
        raise self.retry(exc=e)


# ── Weekly Model Retraining ────────────────────────────────────────────────────

@celery_app.task(bind=True, max_retries=1)
def retrain_model(self):
    """
    Scheduled every Monday at 2am via Celery Beat (see celery_app.py beat_schedule).
    Pipeline:
      1. Load DB rows (live ingested data accumulated this week)
      2. If DB < 100 rows, fall back to training_data/dataset_final.csv (10yr historical)
      3. Retrain XGBoost on all available data
      4. New model saved to disk + promoted to production in DB automatically
    """
    try:
        from ml.trainer import ModelTrainer
        trainer = ModelTrainer()
        run_async(trainer.retrain(include_field_data=True, min_samples=500))
        logger.info("Weekly model retraining completed")
        _log_activity("model_retrain", "Weekly model retraining completed successfully")
    except Exception as e:
        logger.error(f"Retraining task failed: {e}")
        raise self.retry(exc=e)


# ── Field Data Trigger ─────────────────────────────────────────────────────────

@celery_app.task
def queue_field_data_for_retraining(treatment_record_id: str):
    """
    Triggered immediately when a field team logs a treatment outcome.
    Checks if enough new samples have accumulated to justify an early retrain.
    If yes, fires retrain_model early (doesn't wait for Monday).
    """
    logger.info(f"Field data {treatment_record_id} queued for retraining pipeline")
    _check_retrain_threshold()


# ── Stale Alert Cleanup ────────────────────────────────────────────────────────

@celery_app.task
def cleanup_stale_alerts():
    """Hourly: auto-resolve alerts older than 48h with no response."""
    from datetime import datetime, timedelta

    async def _cleanup():
        from sqlalchemy import select, update
        from database.session import AsyncSessionLocal
        from database.models import Alert

        cutoff = datetime.utcnow() - timedelta(hours=48)

        async with AsyncSessionLocal() as db:
            # ✅ Correct async syntax — NOT db.query()
            result = await db.execute(
                select(Alert).where(
                    Alert.status == "active",
                    Alert.created_at < cutoff,
                )
            )
            stale = result.scalars().all()

            if stale:
                stale_ids = [a.id for a in stale]
                await db.execute(
                    update(Alert)
                    .where(Alert.id.in_(stale_ids))
                    .values(
                        status="resolved",
                        response_notes="Auto-resolved: no response within 48h",
                        resolved_at=datetime.utcnow(),
                    )
                )
                await db.commit()
                logger.info(f"Auto-resolved {len(stale)} stale alerts")
            else:
                logger.info("No stale alerts to resolve")

    run_async(_cleanup())


# ── Internal Helpers ───────────────────────────────────────────────────────────

def _log_activity(event_type: str, description: str):
    """Write an entry to the activity_log table."""
    async def _write():
        from database.session import AsyncSessionLocal
        from database.models import ActivityLog

        async with AsyncSessionLocal() as db:
            log = ActivityLog(event_type=event_type, description=description)
            db.add(log)
            await db.commit()

    run_async(_write())


def _check_retrain_threshold():
    """
    Count new field samples since the last model was trained.
    If the count exceeds MODEL_RETRAIN_THRESHOLD (set in .env),
    fire an early retrain instead of waiting for Monday.
    """
    from api.config import get_settings
    s = get_settings()

    async def _check():
        from sqlalchemy import select, func
        from database.session import AsyncSessionLocal
        from database.models import TreatmentRecord, ModelVersion

        async with AsyncSessionLocal() as db:
            # Get the most recently trained model
            # ✅ Correct async syntax — NOT db.query()
            result = await db.execute(
                select(ModelVersion)
                .order_by(ModelVersion.trained_at.desc())
                .limit(1)
            )
            latest_model = result.scalar_one_or_none()

            if not latest_model:
                return

            # Count new treatment records since last training
            count_result = await db.execute(
                select(func.count(TreatmentRecord.id)).where(
                    TreatmentRecord.treated_at > latest_model.trained_at
                )
            )
            new_records = count_result.scalar()

            if new_records >= s.MODEL_RETRAIN_THRESHOLD:
                logger.info(
                    f"Retrain threshold reached ({new_records} new field samples) "
                    f"— triggering early retrain"
                )
                retrain_model.delay()
            else:
                logger.info(
                    f"Field samples since last train: {new_records} / "
                    f"{s.MODEL_RETRAIN_THRESHOLD} needed for early retrain"
                )

    run_async(_check())