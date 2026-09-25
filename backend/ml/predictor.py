"""
Risk Predictor
Core AI prediction engine using XGBoost.
Processes environmental features → risk score → CRITICAL/HIGH/MODERATE/LOW classification.
"""

import numpy as np
import joblib
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from loguru import logger

from ml.feature_extractor import FeatureExtractor
from ml.schemas import PredictionResult, RiskZoneResult, RiskLevel
from api.config import get_settings

settings = get_settings()


class ModelNotAvailable(RuntimeError):
    """Raised when a prediction is requested but no trained model is on disk."""


class RiskPredictor:
    """
    Wraps the trained XGBoost model.

    Input features (per 500m grid cell):
    - rainfall_mm:        7-day accumulated rainfall
    - temperature_c:      Land Surface Temperature
    - ndvi:               Normalized Difference Vegetation Index
    - humidity_pct:       Relative humidity %
    - soil_moisture:      Volumetric soil water content
    - river_buffer_m:     Distance to nearest water body (m)
    - depression_index:   Topographic wetness index
    - flood_risk_index:   Flood risk 0–1 (rainfall + soil saturation + elevation)
    - standing_water_km2: Standing water area from Sentinel-2 imagery
    - sunshine_hours:     Daily sunshine hours
    - population_density: People per km² (NISR Rwanda census)
    - season_weight:      1.0 = rainy season (MAM/OND), 0.5 = dry season
    """

    FEATURE_COLUMNS = [
        "rainfall_mm",
        "temperature_c",
        "ndvi",
        "humidity_pct",
        "soil_moisture",
        "river_buffer_m",
        "depression_index",
        "flood_risk_index",
        "standing_water_km2",
        "sunshine_hours",
        "population_density",
        "season_weight",
    ]

    def __init__(self):
        self.model         = None
        self.scaler        = None
        self.model_version = None
        self.extractor     = FeatureExtractor()
        self._load_model()

    def _load_model(self):
        """Load the trained model and scaler from disk (train with scripts/train_local.py)."""
        model_path  = Path(settings.MODEL_PATH)
        scaler_path = Path(settings.SCALER_PATH)

        if model_path.exists() and scaler_path.exists():
            self.model  = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            self.model_version = getattr(
                self.model,
                "version_tag",
                f"v{datetime.utcfromtimestamp(model_path.stat().st_mtime).strftime('%Y%m%d_%H%M')}",
            )
            logger.info(f"Loaded model from {model_path} — version {self.model_version}")
        else:
            logger.error(
                f"Trained model not found at {model_path} / {scaler_path}. "
                "Run `python -m scripts.train_local` to train it."
            )

    @property
    def ready(self) -> bool:
        return self.model is not None and self.scaler is not None

    def _require_model(self):
        if not self.ready:
            raise ModelNotAvailable(
                "The risk model is not trained yet. Run `python -m scripts.train_local` in the backend."
            )

    def classify_risk(self, probability: float) -> RiskLevel:
        """Map a probability score to a risk level."""
        if probability >= settings.CRITICAL_RISK_THRESHOLD:
            return RiskLevel.CRITICAL
        elif probability >= settings.HIGH_RISK_THRESHOLD:
            return RiskLevel.HIGH
        elif probability >= settings.MODERATE_RISK_THRESHOLD:
            return RiskLevel.MODERATE
        return RiskLevel.LOW

    def _vector(self, feature: dict) -> list:
        return [
            feature.get("rainfall_mm",        0),
            feature.get("temperature_c",      28),
            feature.get("ndvi",               0.4),
            feature.get("humidity_pct",       70),
            feature.get("soil_moisture",      0.3),
            feature.get("river_buffer_m",     500),
            feature.get("depression_index",   0.5),
            feature.get("flood_risk_index",   0.2),
            feature.get("standing_water_km2", 0.5),
            feature.get("sunshine_hours",     6.5),
            feature.get("population_density", 400),
            feature.get("season_weight",      0.5),
        ]

    def predict_batch(self, features: List[dict]) -> List[dict]:
        """Predict risk for many ML-ready feature dictionaries in one model call."""
        self._require_model()
        if not features:
            return []
        scaled = self.scaler.transform(np.array([self._vector(f) for f in features], dtype=float))
        probs  = self.model.predict_proba(scaled)

        out = []
        for feature, p in zip(features, probs):
            high_risk_prob = float(p[2]) + float(p[3])
            out.append({
                "risk_score":    round(high_risk_prob, 4),
                "risk_level":    self.classify_risk(high_risk_prob).value,
                "confidence":    round(float(np.max(p)), 4),
                "model_version": self.model_version,
                "features":      feature,
            })
        return out

    def predict_feature_vector(self, feature: dict) -> dict:
        """Predict risk for one ML-ready feature dictionary (all 12 features)."""
        return self.predict_batch([feature])[0]

    def predict_risk(self, weather: dict, ndvi: float = 0.4, river_distance: float = 500) -> dict:
        """Compatibility helper for live weather + NDVI + river-distance predictions."""
        month        = datetime.utcnow().month
        rainy_months = {3, 4, 5, 10, 11, 12}

        feature = {
            "rainfall_mm":        weather.get("rainfall",    weather.get("rainfall_mm",    0)),
            "temperature_c":      weather.get("temperature", weather.get("temperature_c",  28)),
            "ndvi":               ndvi,
            "humidity_pct":       weather.get("humidity",    weather.get("humidity_pct",   70)),
            "soil_moisture":      weather.get("soil_moisture", 0.3),
            "river_buffer_m":     river_distance,
            "depression_index":   0.5,
            "flood_risk_index":   weather.get("flood_risk_index",   0.2),
            "standing_water_km2": weather.get("standing_water_km2", 0.5),
            "sunshine_hours":     weather.get("sunshine_hours",     6.5),
            "population_density": weather.get("population_density", 400),
            "season_weight":      1.0 if month in rainy_months else 0.5,
        }
        return self.predict_feature_vector(feature)

    def aggregate_to_district(self, zone_results: list) -> dict:
        """
        Aggregate 500m grid cell predictions up to district level.
        District risk  = worst risk level seen in any cell in that district.
        District score = weighted average of all cell scores.
        """
        district_cells = defaultdict(list)
        for zone in zone_results:
            district_cells[zone.region].append(zone)

        risk_order       = {"LOW": 0, "MODERATE": 1, "HIGH": 2, "CRITICAL": 3}
        district_summary = {}

        for district, cells in district_cells.items():
            scores      = [c.risk_score for c in cells]
            levels      = [c.risk_level.value if hasattr(c.risk_level, 'value') else c.risk_level for c in cells]
            worst_level = max(levels, key=lambda l: risk_order[l])
            avg_score   = round(sum(scores) / len(scores), 4)
            high_count  = sum(1 for l in levels if l in ("HIGH", "CRITICAL"))

            district_summary[district] = {
                "district":        district,
                "risk_level":      worst_level,
                "risk_score":      avg_score,
                "high_cell_count": high_count,
                "total_cells":     len(cells),
                "pct_high_risk":   round(high_count / len(cells) * 100, 1),
            }

        return district_summary

    async def predict(
        self,
        region: str,
        prediction_date: datetime,
        features: Optional[List[dict]] = None,
    ) -> PredictionResult:
        """
        Run prediction for all grid cells in a region.
        If features are provided, uses them directly.
        Otherwise extracts from latest satellite/weather data.
        """
        if features is None:
            logger.info(f"Extracting features for {region}")
            features = await self.extractor.extract(region=region)

        predictions = self.predict_batch(features)
        results = []
        for cell, prediction in zip(features, predictions):
            risk_level  = RiskLevel(prediction["risk_level"])

            results.append(RiskZoneResult(
                grid_cell_id=cell.get("id", ""),
                site_name=cell.get("site_name", ""),
                region=cell.get("region", region),
                latitude=cell.get("latitude", 0),
                longitude=cell.get("longitude", 0),
                risk_score=prediction["risk_score"],
                risk_level=risk_level,
                rainfall_mm=cell.get("rainfall_mm"),
                temperature_c=cell.get("temperature_c"),
                ndvi=cell.get("ndvi"),
                humidity_pct=cell.get("humidity_pct"),
            ))

        critical_zones = [r for r in results if r.risk_level == RiskLevel.CRITICAL]
        high_zones     = [r for r in results if r.risk_level == RiskLevel.HIGH]
        mod_zones      = [r for r in results if r.risk_level == RiskLevel.MODERATE]
        low_zones      = [r for r in results if r.risk_level == RiskLevel.LOW]

        return PredictionResult(
            prediction_date=prediction_date,
            region=region,
            total_cells=len(results),
            critical_risk_count=len(critical_zones),
            high_risk_count=len(high_zones),
            moderate_risk_count=len(mod_zones),
            low_risk_count=len(low_zones),
            high_risk_zones=high_zones + critical_zones,
            all_zones=results,
            model_version=self.model_version,
            confidence_score=round(
                sum(p["confidence"] for p in predictions) / len(predictions), 4
            ) if predictions else 0.0,
        )