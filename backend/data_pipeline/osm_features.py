"""
OpenStreetMap environmental feature extraction with OSMnx.
"""

from __future__ import annotations

from typing import Any, Dict


WATER_TAGS = {
    "waterway": True,
    "natural": ["water", "wetland"],
    "water": True,
}


def fetch_water_features(place_name: str):
    """Return OSM water, river, and wetland features for a named place."""
    import osmnx as ox

    return ox.features_from_place(place_name, WATER_TAGS)


def summarize_water_features(place_name: str) -> Dict[str, Any]:
    """Return a small JSON-safe summary that works nicely in Swagger."""
    gdf = fetch_water_features(place_name)

    columns = set(gdf.columns)
    waterway_count = int(gdf["waterway"].notna().sum()) if "waterway" in columns else 0
    wetland_count = int((gdf["natural"] == "wetland").sum()) if "natural" in columns else 0
    water_body_count = int((gdf["natural"] == "water").sum()) if "natural" in columns else 0

    return {
        "place_name": place_name,
        "feature_count": int(len(gdf)),
        "waterway_count": waterway_count,
        "wetland_count": wetland_count,
        "water_body_count": water_body_count,
        "columns": list(gdf.columns[:20]),
    }


def estimate_distance_to_water(latitude: float, longitude: float, dist_m: int = 3000) -> Dict[str, Any]:
    """Estimate distance from a point to the nearest mapped OSM water feature."""
    import osmnx as ox
    from shapely.geometry import Point

    gdf = ox.features_from_point((latitude, longitude), tags=WATER_TAGS, dist=dist_m)
    if gdf.empty:
        return {
            "latitude": latitude,
            "longitude": longitude,
            "search_radius_m": dist_m,
            "feature_count": 0,
            "distance_to_water_m": None,
        }

    projected = ox.projection.project_gdf(gdf)
    point_gdf = ox.projection.project_geometry(Point(longitude, latitude), crs="EPSG:4326", to_crs=projected.crs)[0]
    distance_m = float(projected.geometry.distance(point_gdf).min())

    return {
        "latitude": latitude,
        "longitude": longitude,
        "search_radius_m": dist_m,
        "feature_count": int(len(gdf)),
        "distance_to_water_m": round(distance_m, 2),
    }

