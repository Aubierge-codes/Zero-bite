"""
Database Models
SQLAlchemy ORM models for all Zero_Bite entities.
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime,
    ForeignKey, JSON, Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base

Base = declarative_base()


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id              = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    full_name       = Column(String(200), nullable=False)
    email           = Column(String(200), unique=True, nullable=False, index=True)
    hashed_password = Column(String(300), nullable=False)
    role            = Column(String(50), default="field_worker")
    phone           = Column(String(20))
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime, default=datetime.utcnow)


class RiskZone(Base):
    __tablename__ = "risk_zones"
    id             = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    site_name      = Column(String(300))
    region         = Column(String(200), index=True)
    district       = Column(String(200))
    latitude       = Column(Float, nullable=False)
    longitude      = Column(Float, nullable=False)
    risk_level     = Column(String(50), nullable=False)
    risk_score     = Column(Float, nullable=False)
    # Original 7 environmental features
    rainfall_mm      = Column(Float)
    temperature_c    = Column(Float)
    ndvi             = Column(Float)
    humidity_pct     = Column(Float)
    soil_moisture    = Column(Float)
    river_buffer_m   = Column(Float)
    depression_index = Column(Float)
    # ✅ 5 new features — must match EnvironmentalFeatures
    flood_risk_index    = Column(Float, nullable=True)
    standing_water_km2  = Column(Float, nullable=True)
    sunshine_hours      = Column(Float, nullable=True)
    population_density  = Column(Float, nullable=True)
    season_weight       = Column(Float, nullable=True)
    latest_features = Column(JSON)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at      = Column(DateTime, default=datetime.utcnow)


class ZoneHistory(Base):
    __tablename__ = "zone_history"
    id          = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    zone_id     = Column(UUID(as_uuid=False), ForeignKey("risk_zones.id"), index=True)
    risk_score  = Column(Float)
    risk_level  = Column(String(20))
    rainfall_mm = Column(Float)
    recorded_at = Column(DateTime, default=datetime.utcnow)


class Prediction(Base):
    __tablename__ = "predictions"
    id                   = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    region               = Column(String(200))
    prediction_date      = Column(DateTime)
    # ✅ 4 risk level counts — CRITICAL added to match 4-level system
    critical_risk_count  = Column(Integer, default=0)
    high_risk_count      = Column(Integer, default=0)
    moderate_risk_count  = Column(Integer, default=0)
    low_risk_count       = Column(Integer, default=0)
    model_version        = Column(String(50))
    confidence_score     = Column(Float)
    created_by           = Column(UUID(as_uuid=False), ForeignKey("users.id"))
    created_at           = Column(DateTime, default=datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"
    id              = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    zone_id         = Column(UUID(as_uuid=False), ForeignKey("risk_zones.id"))
    risk_level      = Column(String(20), nullable=False)
    region          = Column(String(200))
    site_name       = Column(String(300))
    trigger_reason  = Column(Text)
    status          = Column(String(50), default="active")
    acknowledged_by = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    assigned_team_id = Column(UUID(as_uuid=False), ForeignKey("field_teams.id"), nullable=True)
    response_notes  = Column(Text, nullable=True)
    resolved_by     = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    resolved_at     = Column(DateTime, nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)


class FieldTeam(Base):
    __tablename__ = "field_teams"
    id             = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name           = Column(String(200), nullable=False)
    leader_name    = Column(String(200))
    leader_phone   = Column(String(20))
    district       = Column(String(200))
    team_size      = Column(Integer, default=4)
    status         = Column(String(50), default="available")
    specialization = Column(String(50), default="general")
    created_at     = Column(DateTime, default=datetime.utcnow)


class TeamAssignment(Base):
    __tablename__ = "team_assignments"
    id          = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    team_id     = Column(UUID(as_uuid=False), ForeignKey("field_teams.id"))
    zone_id     = Column(UUID(as_uuid=False), ForeignKey("risk_zones.id"))
    assigned_by = Column(UUID(as_uuid=False), ForeignKey("users.id"))
    task_type   = Column(String(100))
    priority    = Column(String(20))
    notes       = Column(Text)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class TreatmentRecord(Base):
    __tablename__ = "treatment_records"
    id                  = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    team_id             = Column(UUID(as_uuid=False), ForeignKey("field_teams.id"))
    zone_id             = Column(UUID(as_uuid=False), ForeignKey("risk_zones.id"))
    latitude            = Column(Float)
    longitude           = Column(Float)
    larvicide_ml_used   = Column(Float)
    site_type           = Column(String(100))
    larvae_count_before = Column(Integer, nullable=True)
    larvae_count_after  = Column(Integer, nullable=True)
    notes               = Column(Text)
    treated_at          = Column(DateTime, default=datetime.utcnow)
    logged_by           = Column(UUID(as_uuid=False), ForeignKey("users.id"))


class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"
    id                = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    job_type          = Column(String(100))
    region            = Column(String(200))
    status            = Column(String(50))
    records_processed = Column(Integer, default=0)
    error_message     = Column(Text, nullable=True)
    started_at        = Column(DateTime, default=datetime.utcnow)
    completed_at      = Column(DateTime, nullable=True)


class EnvironmentalFeatures(Base):
    __tablename__ = "environmental_features"
    id               = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    region           = Column(String(200), index=True)
    latitude         = Column(Float)
    longitude        = Column(Float)
    # Original 7
    rainfall_mm      = Column(Float)
    temperature_c    = Column(Float)
    ndvi             = Column(Float)
    humidity_pct     = Column(Float)
    soil_moisture    = Column(Float)
    river_buffer_m   = Column(Float)
    depression_index = Column(Float)
    # 5 new — completes the 12-feature set
    flood_risk_index    = Column(Float, nullable=True)
    standing_water_km2  = Column(Float, nullable=True)
    sunshine_hours      = Column(Float, nullable=True)
    population_density  = Column(Float, nullable=True)
    season_weight       = Column(Float, nullable=True)
    data_source  = Column(String(100))
    recorded_at  = Column(DateTime, default=datetime.utcnow)


class ModelVersion(Base):
    __tablename__ = "model_versions"
    id                 = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    version            = Column(String(50), nullable=False)
    accuracy           = Column(Float)
    precision_score    = Column(Float)
    recall             = Column(Float)
    f1_score           = Column(Float)
    auc_roc            = Column(Float)
    training_samples   = Column(Integer)
    feature_importance = Column(JSON)
    is_production      = Column(Boolean, default=False)
    model_path         = Column(String(500))
    trained_at         = Column(DateTime, default=datetime.utcnow)
    trained_by         = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)


class ActivityLog(Base):
    __tablename__ = "activity_log"
    id             = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    event_type     = Column(String(100))
    description    = Column(Text)
    event_metadata = Column(JSON, nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow)


class GridCell(Base):
    __tablename__ = "grid_cells"
    id                  = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    cell_code           = Column(String(50), unique=True, index=True)
    region              = Column(String(200))
    latitude            = Column(Float)
    longitude           = Column(Float)
    resolution_m        = Column(Integer, default=500)
    current_risk_level  = Column(String(20))
    risk_score          = Column(Float)
    latest_features     = Column(JSON)
    updated_at          = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)