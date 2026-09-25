"""
Feature Extractor
Builds the 12 ML features for every Rwandan district from REAL data.

Live data (Open-Meteo, no API key needed):
- rainfall_mm       daily precipitation sum
- temperature_c     daily mean 2 m temperature
- humidity_pct      daily mean relative humidity
- sunshine_hours    daily sunshine duration
- soil_moisture     Antecedent Precipitation Index derived from the rainfall series
                    (same method the model was trained with, see derive_soil_moisture.py)

Static data (scripts/build_static_features.py — NISR 2022 census, SRTM, OSM):
- river_buffer_m, depression_index, population_density, elevation, flood_risk_base

Derived exactly like the training set (scripts/build_training_dataset.py):
- flood_risk_index, standing_water_km2, season_weight
- ndvi: seasonal proxy (no free keyless NDVI feed; identical to the proxy used in training)

Nothing here is randomly generated. If the weather service is unreachable an
error is raised so callers can report it instead of showing invented numbers.
"""

import asyncio
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import requests
from loguru import logger

from api.config import get_settings
from data_pipeline.rwanda_districts import DISTRICTS, DISTRICT_INFO, canonical_district
from scripts.build_static_features import DISTRICT_STATIC

settings = get_settings()

PAST_DAYS     = 60     # history used for the soil-moisture index + trend charts
FORECAST_DAYS = 16     # Open-Meteo forecast horizon
RAINY_MONTHS  = {3, 4, 5, 10, 11, 12}
KIGALI_TZ     = timezone(timedelta(hours=2))   # Rwanda is UTC+2 year-round

STATIC = {d["district"]: d for d in DISTRICT_STATIC}


class WeatherUnavailable(RuntimeError):
    """Raised when the live weather service cannot be reached."""


def kigali_today():
    return datetime.now(KIGALI_TZ).date()


def _training_rain_max() -> float:
    """Max daily rainfall in the training set — the flood-risk index is scaled by it."""
    try:
        import pandas as pd
        csv = Path("training_data/dataset_final.csv")
        if csv.exists():
            return float(pd.read_csv(csv, usecols=["rainfall_mm"])["rainfall_mm"].max()) or 100.0
    except Exception as e:  # pragma: no cover - only a scaling constant
        logger.warning(f"Could not read training rainfall max: {e}")
    return 100.0


_RAIN_MAX: Optional[float] = None


def _rain_max() -> float:
    global _RAIN_MAX
    if _RAIN_MAX is None:
        _RAIN_MAX = _training_rain_max()
    return _RAIN_MAX


def _fetch_weather_sync(districts: List[tuple]) -> Dict[str, dict]:
    """One batched Open-Meteo request for all districts. Blocking — run in a thread."""
    params = {
        "latitude":      ",".join(str(d[2]) for d in districts),
        "longitude":     ",".join(str(d[3]) for d in districts),
        "daily":         "precipitation_sum,temperature_2m_mean,relative_humidity_2m_mean,sunshine_duration",
        "past_days":     PAST_DAYS,
        "forecast_days": FORECAST_DAYS,
        "timezone":      "Africa/Kigali",
    }
    try:
        resp = requests.get(settings.OPEN_METEO_BASE_URL, params=params, timeout=45)
        resp.raise_for_status()
        payload = resp.json()
    except Exception as exc:
        raise WeatherUnavailable(f"Open-Meteo request failed: {exc}") from exc

    if isinstance(payload, dict):
        payload = [payload]
    if len(payload) != len(districts):
        raise WeatherUnavailable("Open-Meteo returned an unexpected number of locations")
    return {d[0]: p["daily"] for d, p in zip(districts, payload)}


def _fill(values: list, default: float) -> List[float]:
    """Replace None gaps with the previous valid value (weather series are continuous)."""
    out, last = [], default
    for v in values:
        if v is None:
            out.append(last)
        else:
            last = float(v)
            out.append(last)
    return out


def build_daily_features(district: str, daily: dict) -> List[dict]:
    """Turn one district's daily weather series into ML feature dicts (one per day)."""
    info   = DISTRICT_INFO[district]
    static = STATIC[district]
    rain_max = _rain_max()

    rain  = _fill(daily["precipitation_sum"], 0.0)
    temp  = _fill(daily["temperature_2m_mean"], 24.0)
    hum   = _fill(daily["relative_humidity_2m_mean"], 70.0)
    sun_s = _fill(daily["sunshine_duration"], 0.0)

    features, soil = [], 0.3
    for i, day in enumerate(daily["time"]):
        d = datetime.strptime(day, "%Y-%m-%d").date()
        season = 1.0 if d.month in RAINY_MONTHS else 0.5

        # Antecedent Precipitation Index — identical to derive_soil_moisture.py
        soil = float(np.clip(0.85 * soil + rain[i] / 100, 0, 1))

        flood_risk = float(np.clip(
            static["flood_risk_base"] + 0.3 * (rain[i] / rain_max) + 0.2 * soil, 0, 1
        ))
        standing_water = float(np.clip(
            (rain[i] / 20) * soil * (1 - static["elevation"] / 3000), 0, 10
        ))

        features.append({
            "id":                 f"{district}-{day}",
            "site_name":          f"{district} District",
            "region":             district,
            "district":           district,
            "date":               day,
            "latitude":           info["latitude"],
            "longitude":          info["longitude"],
            "rainfall_mm":        rain[i],
            "temperature_c":      temp[i],
            "ndvi":               float(np.clip(season * 0.65, 0, 1)),
            "humidity_pct":       float(np.clip(hum[i], 0, 100)),
            "soil_moisture":      soil,
            "river_buffer_m":     float(static["river_buffer_m"]),
            "depression_index":   float(static["depression_index"]),
            "flood_risk_index":   flood_risk,
            "standing_water_km2": standing_water,
            "sunshine_hours":     float(np.clip(sun_s[i] / 3600, 0, 12)),
            "population_density": float(static["population_density"]),
            "season_weight":      season,
        })
    return features


class FeatureExtractor:
    """Fetches live weather and builds per-district feature series."""

    async def fetch_series(self) -> Dict[str, List[dict]]:
        """{district: [feature dict per day, from PAST_DAYS ago to FORECAST_DAYS ahead]}"""
        logger.info("Fetching live weather for 30 districts (Open-Meteo)")
        weather = await asyncio.to_thread(_fetch_weather_sync, DISTRICTS)
        return {name: build_daily_features(name, daily) for name, daily in weather.items()}

    async def extract(self, region: str = "Rwanda") -> List[dict]:
        """Today's feature vector for each district (or for one district)."""
        series = await self.fetch_series()
        canonical = canonical_district(region)
        names = [canonical] if canonical else list(series.keys())

        today = kigali_today().isoformat()
        out = []
        for name in names:
            day = next((f for f in series[name] if f["date"] == today), None)
            if day:
                out.append(day)
        return out
