"""
Google Earth Engine NDVI helpers for Sentinel-2.
"""

from __future__ import annotations

from typing import Any, Dict, Optional


def initialize_earth_engine() -> None:
    """Initialize Earth Engine, raising a helpful error if auth is missing."""
    import ee

    try:
        ee.Initialize()
    except Exception as exc:
        raise RuntimeError(
            "Google Earth Engine is not initialized. Run `earthengine authenticate` "
            "or configure service-account credentials before using NDVI endpoints."
        ) from exc


def calculate_ndvi(start_date: str = "2025-01-01", end_date: str = "2025-01-30"):
    """Return an Earth Engine NDVI image from Sentinel-2 surface imagery."""
    import ee

    initialize_earth_engine()
    image = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterDate(start_date, end_date)
        .sort("CLOUDY_PIXEL_PERCENTAGE")
        .first()
    )
    return image.normalizedDifference(["B8", "B4"]).rename("NDVI")


def calculate_ndvi_summary(
    latitude: float,
    longitude: float,
    start_date: str = "2025-01-01",
    end_date: str = "2025-01-30",
    buffer_m: int = 1000,
) -> Dict[str, Any]:
    """Return mean NDVI near a coordinate as JSON-safe API output."""
    import ee

    ndvi = calculate_ndvi(start_date=start_date, end_date=end_date)
    point = ee.Geometry.Point([longitude, latitude]).buffer(buffer_m)
    stats: Optional[Dict[str, Any]] = ndvi.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=point,
        scale=10,
        maxPixels=1_000_000,
    ).getInfo()

    return {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date,
        "end_date": end_date,
        "buffer_m": buffer_m,
        "ndvi": None if not stats else stats.get("NDVI"),
    }

