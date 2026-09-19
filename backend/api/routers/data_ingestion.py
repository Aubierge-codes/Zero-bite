from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database.session import get_db
from database.models import IngestionJob, EnvironmentalFeatures
from data_pipeline.open_meteo_service import OpenMeteoError, get_weather

router = APIRouter()


@router.get("/status")
async def ingestion_status(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IngestionJob).order_by(IngestionJob.started_at.desc()).limit(20))
    jobs = result.scalars().all()
    return [{"id": str(j.id), "job_type": j.job_type, "status": j.status,
             "records_processed": j.records_processed, "started_at": j.started_at} for j in jobs]


@router.post("/satellite/trigger")
async def trigger_satellite():
    return {"message": "Satellite ingestion triggered (requires Celery + credentials)"}


@router.post("/weather/trigger")
async def trigger_weather():
    return {"message": "Weather ingestion triggered (requires Celery; live Open-Meteo endpoint is /api/v1/data/weather)"}


@router.get("/weather")
async def weather(lat: float = Query(...), lon: float = Query(...)):
    try:
        return get_weather(lat, lon)
    except OpenMeteoError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Open-Meteo request failed: {exc}") from exc


@router.get("/osm/water")
async def osm_water(place_name: str = Query("Kigali, Rwanda")):
    try:
        from data_pipeline.osm_features import summarize_water_features

        return summarize_water_features(place_name)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"OSM water feature lookup failed: {exc}") from exc


@router.get("/osm/distance-to-water")
async def distance_to_water(
    lat: float = Query(...),
    lon: float = Query(...),
    radius_m: int = Query(3000, ge=100, le=20000),
):
    try:
        from data_pipeline.osm_features import estimate_distance_to_water

        return estimate_distance_to_water(lat, lon, dist_m=radius_m)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"OSM distance lookup failed: {exc}") from exc


@router.get("/ndvi")
async def ndvi(
    lat: float = Query(-1.9441),
    lon: float = Query(30.0619),
    start_date: str = Query("2025-01-01"),
    end_date: str = Query("2025-01-30"),
    buffer_m: int = Query(1000, ge=10, le=10000),
):
    try:
        from data_pipeline.ndvi_engine import calculate_ndvi_summary

        return calculate_ndvi_summary(lat, lon, start_date, end_date, buffer_m)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/maps/demo")
async def create_demo_map():
    try:
        from data_pipeline.map_visualizer import save_demo_map

        path = save_demo_map()
        return {"message": "Demo Leafmap map created", "path": path}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Map generation failed: {exc}") from exc
