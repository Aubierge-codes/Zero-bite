"""
Open-Meteo weather integration.

Fetches live rainfall, humidity, temperature, and wind data for a coordinate.
"""

from __future__ import annotations

from typing import Any, Dict

import requests


BASE_URL = "https://api.open-meteo.com/v1/forecast"


class OpenMeteoError(RuntimeError):
    """Raised when Open-Meteo cannot return usable weather data."""


def get_weather(latitude: float, longitude: float) -> Dict[str, float]:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "temperature_2m,relative_humidity_2m,rain,wind_speed_10m",
        "forecast_days": 1,
        "timezone": "auto",
    }

    response = requests.get(BASE_URL, params=params, timeout=15)
    response.raise_for_status()
    data: Dict[str, Any] = response.json()

    try:
        hourly = data["hourly"]
        return {
            "temperature": float(hourly["temperature_2m"][0]),
            "humidity": float(hourly["relative_humidity_2m"][0]),
            "rainfall": float(hourly["rain"][0]),
            "wind_speed": float(hourly["wind_speed_10m"][0]),
        }
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise OpenMeteoError("Open-Meteo response did not include expected hourly weather fields") from exc

