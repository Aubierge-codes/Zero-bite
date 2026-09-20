"""
Zero_Bite Test Suite
Tests for prediction engine, alert system, field teams, and API endpoints.
"""

import pytest
import numpy as np
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch


# ─── ML PREDICTION TESTS ────────────────────────────────────────────────────

class TestRiskPredictor:

    def test_classify_risk_critical(self):
        from ml.predictor import RiskPredictor
        predictor = RiskPredictor()
        assert predictor.classify_risk(0.85) == "CRITICAL"

    def test_classify_risk_high(self):
        from ml.predictor import RiskPredictor
        predictor = RiskPredictor()
        assert predictor.classify_risk(0.70) == "HIGH"

    def test_classify_risk_moderate(self):
        from ml.predictor import RiskPredictor
        predictor = RiskPredictor()
        assert predictor.classify_risk(0.55) == "MODERATE"

    def test_classify_risk_low(self):
        from ml.predictor import RiskPredictor
        predictor = RiskPredictor()
        assert predictor.classify_risk(0.20) == "LOW"

    def test_demo_model_loads(self):
        from ml.predictor import RiskPredictor
        predictor = RiskPredictor()
        assert predictor.model is not None
        assert predictor.scaler is not None

    def test_prediction_output_shape(self):
        from ml.predictor import RiskPredictor
        import asyncio
        predictor = RiskPredictor()

        features = [
            {
                "id": f"cell-{i}", "site_name": f"Site {i}", "latitude": -1.94 + i * 0.001,
                "longitude": 30.06 + i * 0.001, "rainfall_mm": 45.0, "temperature_c": 28.0,
                "ndvi": 0.6, "humidity_pct": 80.0, "soil_moisture": 0.4,
                "river_buffer_m": 200.0, "depression_index": 0.6,
            }
            for i in range(10)
        ]

        result = asyncio.get_event_loop().run_until_complete(
            predictor.predict(region="TestRegion", prediction_date=datetime.utcnow(), features=features)
        )

        assert result.total_cells == 10
        assert result.high_risk_count + result.moderate_risk_count + result.low_risk_count == 10

    def test_high_rainfall_increases_risk(self):
        from ml.predictor import RiskPredictor
        import asyncio
        predictor = RiskPredictor()

        def make_features(rainfall):
            return [{
                "id": "test", "site_name": "Test", "latitude": -1.94, "longitude": 30.06,
                "rainfall_mm": rainfall, "temperature_c": 28, "ndvi": 0.6,
                "humidity_pct": 80, "soil_moisture": 0.4, "river_buffer_m": 100,
                "depression_index": 0.7,
            }]

        low_rain = asyncio.get_event_loop().run_until_complete(
            predictor.predict("R", datetime.utcnow(), make_features(5.0))
        )
        high_rain = asyncio.get_event_loop().run_until_complete(
            predictor.predict("R", datetime.utcnow(), make_features(80.0))
        )

        low_score = low_rain.all_zones[0].risk_score
        high_score = high_rain.all_zones[0].risk_score
        assert high_score >= low_score, "Higher rainfall should yield equal or higher risk"


# ─── FEATURE EXTRACTOR TESTS ─────────────────────────────────────────────────

class TestFeatureExtractor:

    def test_demo_features_count(self):
        from ml.feature_extractor import FeatureExtractor
        extractor = FeatureExtractor()
        features = extractor._generate_demo_features("Rwanda")
        assert len(features) == 145

    def test_feature_columns_present(self):
        from ml.feature_extractor import FeatureExtractor
        extractor = FeatureExtractor()
        features = extractor._generate_demo_features("Rwanda")
        required = ["rainfall_mm", "temperature_c", "ndvi", "humidity_pct",
                    "soil_moisture", "river_buffer_m", "depression_index"]
        for feat in features[:5]:
            for col in required:
                assert col in feat, f"Missing feature: {col}"

    def test_ndvi_in_valid_range(self):
        from ml.feature_extractor import FeatureExtractor
        extractor = FeatureExtractor()
        features = extractor._generate_demo_features("Rwanda")
        for f in features:
            assert -1 <= f["ndvi"] <= 1, f"NDVI out of range: {f['ndvi']}"

    def test_humidity_in_valid_range(self):
        from ml.feature_extractor import FeatureExtractor
        extractor = FeatureExtractor()
        features = extractor._generate_demo_features("Rwanda")
        for f in features:
            assert 0 <= f["humidity_pct"] <= 100


# ─── ALERT ENGINE TESTS ──────────────────────────────────────────────────────

class TestAlertEngine:

    @pytest.mark.asyncio
    async def test_alert_engine_instantiation(self):
        from alerts.alert_engine import AlertEngine
        engine = AlertEngine()
        assert engine is not None
        assert engine.notifier is not None


# ─── MODEL TRAINER TESTS ─────────────────────────────────────────────────────

class TestModelTrainer:

    def test_engineer_labels(self):
        import pandas as pd
        from ml.trainer import ModelTrainer
        trainer = ModelTrainer()

        df = pd.DataFrame({
            "rainfall_mm": [80, 10, 40],
            "temperature_c": [30, 20, 25],
            "ndvi": [0.8, 0.2, 0.5],
            "humidity_pct": [90, 50, 70],
            "soil_moisture": [0.8, 0.1, 0.4],
            "river_buffer_m": [50, 1000, 300],
            "depression_index": [0.9, 0.1, 0.5],
        })

        labels = trainer.engineer_labels(df)
        assert len(labels) == 3
        assert set(labels).issubset({0, 1, 2})


# ─── NOTIFICATION SERVICE TESTS ──────────────────────────────────────────────

class TestNotificationService:

    @pytest.mark.asyncio
    async def test_sms_fails_gracefully_without_key(self):
        """Should not raise even if AT credentials are missing."""
        from alerts.notification_service import NotificationService
        svc = NotificationService()
        # Should not raise
        await svc.send_sms("+250788000000", "Test message")

    @pytest.mark.asyncio
    async def test_email_fails_gracefully_without_key(self):
        from alerts.notification_service import NotificationService
        svc = NotificationService()
        await svc.send_email("test@example.com", "Test", "<p>Test</p>")
