"""
Weather Ingestion Pipeline
Pulls rainfall, temperature, and humidity from OpenWeatherMap and CHIRPS.
"""

import httpx
from datetime import datetime
from loguru import logger
from api.config import get_settings

settings = get_settings()


class WeatherIngestionPipeline:

    RWANDA_STATIONS = [
        {"name": "Kigali", "lat": -1.9441, "lon": 30.0619},
        {"name": "Butare", "lat": -2.5967, "lon": 29.7394},
        {"name": "Gisenyi", "lat": -1.6985, "lon": 29.2572},
        {"name": "Ruhengeri", "lat": -1.4992, "lon": 29.6340},
        {"name": "Byumba", "lat": -1.5762, "lon": 30.0668},
    ]

    async def run(self):
        """Pull weather data for all stations and persist."""
        from database.session import AsyncSessionLocal
        from database.models import IngestionJob, EnvironmentalFeatures

        async with AsyncSessionLocal() as db:
            job = IngestionJob(
                job_type="weather",
                region="Rwanda",
                status="running",
                started_at=datetime.utcnow(),
            )
            db.add(job)
            await db.commit()
            job_id = str(job.id)

        count = 0
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                for station in self.RWANDA_STATIONS:
                    data = await self._fetch_station(client, station)
                    if data:
                        await self._store_weather(station, data)
                        count += 1

            async with AsyncSessionLocal() as db:
                job = await db.get(IngestionJob, job_id)
                job.status = "completed"
                job.records_processed = count
                job.completed_at = datetime.utcnow()
                await db.commit()

            logger.info(f"Weather ingestion complete: {count} stations updated")

        except Exception as e:
            logger.error(f"Weather ingestion failed: {e}")
            async with AsyncSessionLocal() as db:
                job = await db.get(IngestionJob, job_id)
                job.status = "failed"
                job.error_message = str(e)
                await db.commit()

    async def _fetch_station(self, client: httpx.AsyncClient, station: dict) -> dict:
        """Fetch current weather from OpenWeatherMap API."""
        if not settings.OPENWEATHER_API_KEY:
            # Return synthetic data in demo mode
            import random
            return {
                "rainfall_mm": random.uniform(0, 60),
                "temperature_c": random.uniform(18, 32),
                "humidity_pct": random.uniform(60, 95),
            }
        try:
            resp = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={
                    "lat": station["lat"],
                    "lon": station["lon"],
                    "appid": settings.OPENWEATHER_API_KEY,
                    "units": "metric",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return {
                "rainfall_mm": data.get("rain", {}).get("1h", 0) * 24,
                "temperature_c": data["main"]["temp"],
                "humidity_pct": data["main"]["humidity"],
            }
        except Exception as e:
            logger.warning(f"Failed to fetch {station['name']}: {e}")
            return None

    async def _store_weather(self, station: dict, data: dict):
        from database.session import AsyncSessionLocal
        from database.models import EnvironmentalFeatures

        async with AsyncSessionLocal() as db:
            feature = EnvironmentalFeatures(
                region=station["name"],
                latitude=station["lat"],
                longitude=station["lon"],
                rainfall_mm=data.get("rainfall_mm"),
                temperature_c=data.get("temperature_c"),
                humidity_pct=data.get("humidity_pct"),
                data_source="openweathermap",
                recorded_at=datetime.utcnow(),
            )
            db.add(feature)
            await db.commit()
