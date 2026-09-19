from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum


class RiskLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MODERATE = "MODERATE"
    LOW = "LOW"


class RiskZoneResult(BaseModel):
    grid_cell_id: str
    site_name: str
    region: str
    latitude: float
    longitude: float
    risk_score: float
    risk_level: RiskLevel
    rainfall_mm: Optional[float] = None
    temperature_c: Optional[float] = None
    ndvi: Optional[float] = None
    humidity_pct: Optional[float] = None


class PredictionRequest(BaseModel):
    region: str = "Rwanda"
    prediction_date: Optional[datetime] = None
    features: Optional[List[dict]] = None


class PredictionResponse(BaseModel):
    id: Optional[str] = None
    prediction_date: datetime
    region: str
    high_risk_count: int
    moderate_risk_count: int
    low_risk_count: int
    model_version: str
    confidence_score: float
    created_at: Optional[datetime] = None


class PredictionResult(BaseModel):
    prediction_date: datetime
    region: str
    total_cells: int
    critical_risk_count: int = 0
    high_risk_count: int
    moderate_risk_count: int
    low_risk_count: int
    high_risk_zones: List[RiskZoneResult]
    all_zones: List[RiskZoneResult]
    model_version: str
    confidence_score: float


class ModelMetrics(BaseModel):
    version: str
    accuracy: float
    precision_score: float
    recall: float
    f1_score: float
    training_samples: int
    auc_roc: Optional[float] = None


class RetrainRequest(BaseModel):
    include_field_data: bool = True
    min_samples: Optional[int] = 500
