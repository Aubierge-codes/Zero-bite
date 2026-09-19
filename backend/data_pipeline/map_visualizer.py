"""
Leafmap visualization helpers.
"""

from __future__ import annotations

from pathlib import Path
from typing import Iterable, Mapping, Optional

import leafmap.foliumap as leafmap


def create_map(latitude: float = -1.9441, longitude: float = 30.0619, zoom: int = 11):
    return leafmap.Map(center=[latitude, longitude], zoom=zoom)


def create_risk_map(
    zones: Optional[Iterable[Mapping[str, object]]] = None,
    latitude: float = -1.9441,
    longitude: float = 30.0619,
    zoom: int = 11,
):
    import folium

    risk_colors = {"HIGH": "red", "MODERATE": "orange", "LOW": "green"}
    m = create_map(latitude=latitude, longitude=longitude, zoom=zoom)

    for zone in zones or []:
        risk_level = str(zone.get("risk_level", "LOW")).upper()
        folium.CircleMarker(
            location=[float(zone["latitude"]), float(zone["longitude"])],
            radius=8,
            popup=f"{zone.get('site_name', 'Risk zone')} - {risk_level}",
            color=risk_colors.get(risk_level, "blue"),
            fill=True,
            fill_opacity=0.75,
        ).add_to(m)

    return m


def save_demo_map(output_path: str = "maps/kigali_demo_map.html") -> str:
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    m = create_map()
    m.to_html(str(path))
    return str(path)
