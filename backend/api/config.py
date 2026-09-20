from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):

    # ── App ───────────────────────────────────────────────────────────────────
    APP_NAME:   str  = "Zero_Bite"
    APP_ENV:    str  = "development"
    DEBUG:      bool = True
    SECRET_KEY: str  = "change-me"
    API_VERSION: str = "v1"

    # ── Database ──────────────────────────────────────────────────────────────
    # SQLite by default so `uvicorn api.main:app --reload` works right after a
    # fresh clone with no extra services running. Set DATABASE_URL in .env to
    # point at Postgres for staging/production.
    DATABASE_URL:          str = "sqlite+aiosqlite:///./zerobite_dev.db"
    DATABASE_POOL_SIZE:    int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # ── Redis / Celery ────────────────────────────────────────────────────────
    REDIS_URL:              str = "redis://localhost:6379/0"
    CELERY_BROKER_URL:      str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND:  str = "redis://localhost:6379/2"

    # ── Satellite / Weather APIs ──────────────────────────────────────────────
    COPERNICUS_USERNAME:  Optional[str] = None
    COPERNICUS_PASSWORD:  Optional[str] = None
    OPENWEATHER_API_KEY:  Optional[str] = None
    OPEN_METEO_BASE_URL:  str = "https://api.open-meteo.com/v1/forecast"

    # ── SMS — Africa's Talking ────────────────────────────────────────────────
    AT_API_KEY:              Optional[str] = None
    AT_USERNAME:             Optional[str] = None
    AFRICASTALKING_API_KEY:  Optional[str] = None
    AFRICASTALKING_USERNAME: Optional[str] = None
    AT_SENDER_ID:            str = "ZeroBite"

    # ── Email ─────────────────────────────────────────────────────────────────
    SENDGRID_API_KEY: Optional[str] = None
    FROM_EMAIL:       str = "alerts@zerobite.rw"

    # ── Push Notifications ────────────────────────────────────────────────────
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None

    # ── ML Model ──────────────────────────────────────────────────────────────
    MODEL_PATH:  str = "models/risk_classifier.joblib"
    SCALER_PATH: str = "models/feature_scaler.joblib"

    # How many new field treatment records trigger an early retrain
    MODEL_RETRAIN_THRESHOLD: int = 50

    PREDICTION_CONFIDENCE_THRESHOLD: float = 0.65

    # ── Risk Thresholds ───────────────────────────────────────────────────────
    # Must match trainer.py engineer_labels() and predictor.py classify_risk()
    CRITICAL_RISK_THRESHOLD:  float = 0.80   # ✅ ADDED — was missing, caused crash
    HIGH_RISK_THRESHOLD:      float = 0.65   # corrected from 0.70 to match trainer
    MODERATE_RISK_THRESHOLD:  float = 0.35   # corrected from 0.40 to match trainer

    ALERT_LEAD_TIME_HOURS: int = 24

    # ── Geography ─────────────────────────────────────────────────────────────
    DEFAULT_COUNTRY:       str = "Rwanda"
    DEFAULT_EPSG:          int = 32736
    GRID_RESOLUTION_METERS: int = 500
    RIVER_BUFFER_METERS:    int = 200

    # ── Computed properties ───────────────────────────────────────────────────
    @property
    def africastalking_api_key(self) -> Optional[str]:
        return self.AFRICASTALKING_API_KEY or self.AT_API_KEY

    @property
    def africastalking_username(self) -> Optional[str]:
        return self.AFRICASTALKING_USERNAME or self.AT_USERNAME or "sandbox"

    class Config:
        env_file = ".env"
        extra   = "ignore"   # ✅ ADDED — silently ignores unknown .env keys
                             # prevents crashes if .env has keys not in Settings


@lru_cache()
def get_settings() -> Settings:
    return Settings()