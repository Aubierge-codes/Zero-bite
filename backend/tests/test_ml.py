"""Risk model, feature building and risk engine."""

from datetime import timedelta

import pytest

from tests.conftest import run


# ── Predictor ─────────────────────────────────────────────────────────────────

def test_trained_model_loads():
    from ml.runtime import predictor
    assert predictor.ready, "models/risk_classifier.joblib + feature_scaler.joblib must exist"
    assert predictor.model_version


@pytest.mark.parametrize("attr,level", [
    ("CRITICAL_RISK_THRESHOLD", "CRITICAL"),
    ("HIGH_RISK_THRESHOLD", "HIGH"),
    ("MODERATE_RISK_THRESHOLD", "MODERATE"),
])
def test_classify_risk_uses_configured_thresholds(attr, level):
    from api.config import get_settings
    from ml.runtime import predictor
    threshold = getattr(get_settings(), attr)
    assert predictor.classify_risk(threshold) == level
    assert predictor.classify_risk(threshold - 0.001) != level


def test_classify_risk_low():
    from ml.runtime import predictor
    assert predictor.classify_risk(0.0) == "LOW"


def test_predict_batch_output():
    from ml.runtime import predictor
    feats = [{"rainfall_mm": r, "season_weight": 1.0, "humidity_pct": 85} for r in (0, 20, 60)]
    out = predictor.predict_batch(feats)
    assert len(out) == 3
    for p in out:
        assert 0.0 <= p["risk_score"] <= 1.0
        assert 0.0 <= p["confidence"] <= 1.0
        assert p["risk_level"] in {"LOW", "MODERATE", "HIGH", "CRITICAL"}


def test_missing_model_raises(tmp_path, monkeypatch):
    from ml.predictor import ModelNotAvailable, RiskPredictor
    p = RiskPredictor.__new__(RiskPredictor)
    p.model = p.scaler = None
    with pytest.raises(ModelNotAvailable):
        p.predict_batch([{}])


# ── Feature building ─────────────────────────────────────────────────────────

def _daily(n=5, rain=10.0):
    return {
        "time": [f"2026-04-0{i + 1}" for i in range(n)],
        "precipitation_sum": [rain] * n,
        "temperature_2m_mean": [22.0] * n,
        "relative_humidity_2m_mean": [80.0] * n,
        "sunshine_duration": [7200.0] * n,
    }


def test_soil_moisture_follows_antecedent_precipitation_index():
    from ml.feature_extractor import build_daily_features
    feats = build_daily_features("Kayonza", _daily(rain=10.0))
    expected, soil = [], 0.3
    for _ in feats:
        soil = min(1.0, 0.85 * soil + 0.1)
        expected.append(soil)
    assert [round(f["soil_moisture"], 6) for f in feats] == [round(v, 6) for v in expected]


def test_feature_ranges_and_units():
    from ml.feature_extractor import build_daily_features
    feats = build_daily_features("Bugesera", _daily())
    for f in feats:
        assert f["sunshine_hours"] == 2.0            # 7200 s -> 2 h
        assert f["season_weight"] == 1.0              # April = rainy season
        assert 0 <= f["flood_risk_index"] <= 1
        assert 0 <= f["ndvi"] <= 1
        assert f["population_density"] > 0
        assert f["district"] == "Bugesera"


def test_missing_values_are_carried_forward():
    from ml.feature_extractor import build_daily_features
    d = _daily()
    d["temperature_2m_mean"][2] = None
    feats = build_daily_features("Huye", d)
    assert feats[2]["temperature_c"] == feats[1]["temperature_c"]


def test_canonical_district_lookup():
    from data_pipeline.rwanda_districts import DISTRICT_NAMES, canonical_district
    assert len(DISTRICT_NAMES) == 30 == len(set(DISTRICT_NAMES))
    assert canonical_district("  kayonza ") == "Kayonza"
    assert canonical_district("Atlantis") is None


# ── Risk engine (synthetic weather, see conftest) ───────────────────────────

def test_engine_today_covers_all_districts():
    from ml.runtime import engine
    today = run(engine.today())
    assert len(today) == 30
    for day in today.values():
        assert day["risk_level"] in {"LOW", "MODERATE", "HIGH", "CRITICAL"}


def test_engine_weekly_trend_joins_history_and_forecast():
    from ml.runtime import engine
    weeks = run(engine.national_weekly(weeks=6))
    assert len(weeks) == 8
    current = weeks[5]
    assert current["historical"] is not None and current["historical"] == current["predicted"]
    assert all(w["historical"] is None for w in weeks[6:])


def test_engine_series_window():
    from ml.feature_extractor import kigali_today
    from ml.runtime import engine
    series = run(engine.series("Huye", past=14, ahead=16))
    assert len(series) == 31
    assert series[0]["date"] == (kigali_today() - timedelta(days=14)).isoformat()
