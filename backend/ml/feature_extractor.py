"""
Feature Extractor
Extracts ML-ready features from satellite imagery and weather data
for each 500m grid cell in the target region.

Features extracted:
- rainfall_mm:        7-day accumulated rainfall (CHIRPS/OpenWeatherMap)
- temperature_c:      Land Surface Temperature (Landsat-8 Band 10)
- ndvi:               Normalized Difference Vegetation Index (Sentinel-2 B8/B4)
- humidity_pct:       Relative humidity (weather station / ERA5)
- soil_moisture:      Volumetric soil water (Sentinel-1 SAR)
- river_buffer_m:     Distance to nearest water body (OSM/DEM)
- depression_index:   Topographic Wetness Index (SRTM DEM)
- flood_risk_index:   Flood risk 0–1 (rainfall + soil saturation + elevation)
- standing_water_km2: Standing water area km² (Sentinel-2 optical)
- sunshine_hours:     Daily sunshine hours (Open-Meteo / Meteo Rwanda)
- population_density: People per km² (NISR Rwanda census)
- season_weight:      1.0 = rainy season (MAM/OND), 0.5 = dry season
"""

import uuid
import numpy as np
from datetime import datetime
from typing import List, Dict
from loguru import logger


class FeatureExtractor:

    def __init__(self):
        self.grid_resolution_m = 500

    async def extract(self, region: str) -> List[Dict]:
        """
        Main extraction pipeline.
        In production: fetches real satellite tiles and weather data.
        In demo: generates realistic synthetic features.
        """
        logger.info(f"Extracting features for region: {region}")

        try:
            # ✅ All 12 extractions called before the loop that uses them
            rainfall         = await self._get_rainfall(region)
            temperature      = await self._get_land_surface_temperature(region)
            ndvi             = await self._get_ndvi(region)
            humidity         = await self._get_humidity(region)
            soil_moisture    = await self._get_soil_moisture(region)
            river_buffers    = await self._get_river_buffers(region)
            depression_index = await self._get_depression_index(region)
            flood_risk       = await self._get_flood_risk(region)
            standing_water   = await self._get_standing_water(region)
            sunshine         = await self._get_sunshine_hours(region)
            pop_density      = await self._get_population_density(region)
            season_weight    = self._get_season_weight()   # not async

            grid_cells = await self._get_grid_cells(region)
            features = []

            for i, cell in enumerate(grid_cells):
                features.append({
                    "id":                 cell["id"],
                    "site_name":          cell.get("name", f"Cell-{i+1}"),
                    "region":             region,
                    "latitude":           cell["latitude"],
                    "longitude":          cell["longitude"],
                    "rainfall_mm":        float(rainfall[i % len(rainfall)]),
                    "temperature_c":      float(temperature[i % len(temperature)]),
                    "ndvi":               float(ndvi[i % len(ndvi)]),
                    "humidity_pct":       float(humidity[i % len(humidity)]),
                    "soil_moisture":      float(soil_moisture[i % len(soil_moisture)]),
                    "river_buffer_m":     float(river_buffers[i % len(river_buffers)]),
                    "depression_index":   float(depression_index[i % len(depression_index)]),
                    "flood_risk_index":   float(flood_risk[i % len(flood_risk)]),
                    "standing_water_km2": float(standing_water[i % len(standing_water)]),
                    "sunshine_hours":     float(sunshine[i % len(sunshine)]),
                    "population_density": float(pop_density[i % len(pop_density)]),
                    "season_weight":      season_weight,
                })

            logger.info(f"Extracted {len(features)} grid cells for {region}")
            return features

        except Exception as e:
            logger.error(f"Feature extraction failed: {e}")
            return self._generate_demo_features(region)

    # ── Original 7 extraction methods ─────────────────────────────────────────

    async def _get_rainfall(self, region: str) -> np.ndarray:
        """7-day accumulated rainfall from CHIRPS or OpenWeatherMap."""
        return np.random.gamma(shape=2, scale=15, size=200)  # mm

    async def _get_land_surface_temperature(self, region: str) -> np.ndarray:
        """LST from Landsat-8 thermal band (Band 10), converted to Celsius."""
        return np.random.normal(loc=28, scale=3, size=200)

    async def _get_ndvi(self, region: str) -> np.ndarray:
        """NDVI from Sentinel-2: (B8 - B4) / (B8 + B4). Range: -1 to 1."""
        return np.clip(np.random.normal(loc=0.55, scale=0.15, size=200), -1, 1)

    async def _get_humidity(self, region: str) -> np.ndarray:
        """Relative humidity % from ERA5 reanalysis or weather stations."""
        return np.clip(np.random.normal(loc=78, scale=10, size=200), 0, 100)

    async def _get_soil_moisture(self, region: str) -> np.ndarray:
        """Volumetric soil water content from Sentinel-1 SAR backscatter."""
        return np.clip(np.random.beta(a=2, b=3, size=200), 0, 1)

    async def _get_river_buffers(self, region: str) -> np.ndarray:
        """Distance to nearest river/water body in meters (from DEM + OSM)."""
        return np.random.exponential(scale=300, size=200)

    async def _get_depression_index(self, region: str) -> np.ndarray:
        """Topographic Wetness Index from SRTM 30m DEM. Higher = more ponding."""
        return np.clip(np.random.beta(a=1.5, b=2.5, size=200), 0, 1)

    # ── 5 new extraction methods ───────────────────────────────────────────────

    async def _get_flood_risk(self, region: str) -> np.ndarray:
        """Flood risk index 0–1 based on rainfall + soil saturation + elevation."""
        return np.clip(np.random.beta(1.5, 4, size=200), 0, 1)

    async def _get_standing_water(self, region: str) -> np.ndarray:
        """Standing water area in km² detected from Sentinel-2 optical imagery."""
        return np.random.gamma(shape=1.2, scale=0.5, size=200)

    async def _get_sunshine_hours(self, region: str) -> np.ndarray:
        """Daily sunshine hours from Open-Meteo or Meteo Rwanda."""
        return np.clip(np.random.normal(6.5, 2.0, size=200), 0, 12)

    async def _get_population_density(self, region: str) -> np.ndarray:
        """People per km² from NISR Rwanda census data.
        Rwanda avg ~500/km², up to ~5000 in Kigali."""
        return np.random.lognormal(mean=6.0, sigma=0.8, size=200)

    def _get_season_weight(self) -> float:
        """
        Returns 1.0 during rainy seasons, 0.5 during dry season.
        Rwanda rainy seasons: MAM (Mar–May) and OND (Oct–Dec).
        """
        month = datetime.utcnow().month
        rainy_months = {3, 4, 5, 10, 11, 12}
        return 1.0 if month in rainy_months else 0.5

    # ── Grid cell loader ───────────────────────────────────────────────────────

    async def _get_grid_cells(self, region: str) -> List[Dict]:
        """
        Get 500m grid cells covering the region from the database.
        Falls back to a synthetic Kigali grid if DB is empty or unavailable.
        """
        try:
            from database.session import AsyncSessionLocal
            from database.models import GridCell
            from sqlalchemy import select

            async with AsyncSessionLocal() as db:
                # ✅ Correct async SQLAlchemy syntax (NOT db.query())
                result = await db.execute(
                    select(GridCell).where(GridCell.region == region)
                )
                cells = result.scalars().all()
                if cells:
                    return [
                        {
                            "id":        str(c.id),
                            "name":      c.cell_code,
                            "latitude":  c.latitude,
                            "longitude": c.longitude,
                        }
                        for c in cells
                    ]
        except Exception as e:
            logger.warning(f"DB grid cell fetch failed, using demo grid: {e}")

        # Demo fallback: 15×14 = 210 cells over Kigali bounds
        cells = []
        lat_start, lon_start = -1.98, 30.01
        for i in range(15):
            for j in range(14):
                cells.append({
                    "id":        str(uuid.uuid4()),
                    "name":      f"KGL-{i:02d}{j:02d}",
                    "latitude":  lat_start + i * 0.005,
                    "longitude": lon_start + j * 0.005,
                })
        return cells

    # ── Demo fallback ──────────────────────────────────────────────────────────

    def _generate_demo_features(self, region: str) -> List[Dict]:
        """
        Fallback demo features if the full extraction pipeline fails.
        Covers all 12 feature columns so predictor never receives missing keys.
        """
        np.random.seed(42)
        month = datetime.utcnow().month
        season_weight = 1.0 if month in {3, 4, 5, 10, 11, 12} else 0.5
        features = []

        for i in range(145):
            features.append({
                "id":                 str(uuid.uuid4()),
                "site_name":          f"Site-{i+1}",
                "region":             region,
                "latitude":           -1.98  + np.random.uniform(-0.05, 0.05),
                "longitude":          30.06  + np.random.uniform(-0.05, 0.05),
                # Original 7
                "rainfall_mm":        float(np.random.gamma(2, 15)),
                "temperature_c":      float(np.random.normal(28, 3)),
                "ndvi":               float(np.clip(np.random.normal(0.55, 0.15), 0, 1)),
                "humidity_pct":       float(np.clip(np.random.normal(78, 10), 0, 100)),
                "soil_moisture":      float(np.random.beta(2, 3)),
                "river_buffer_m":     float(np.random.exponential(300)),
                "depression_index":   float(np.random.beta(1.5, 2.5)),
                # 5 new
                "flood_risk_index":   float(np.clip(np.random.beta(1.5, 4), 0, 1)),
                "standing_water_km2": float(np.random.gamma(1.2, 0.5)),
                "sunshine_hours":     float(np.clip(np.random.normal(6.5, 2.0), 0, 12)),
                "population_density": float(np.random.lognormal(6.0, 0.8)),
                "season_weight":      season_weight,
            })

        return features