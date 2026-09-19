from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from database.session import get_db
from database.models import RiskZone

router = APIRouter()


@router.get("/heatmap")
async def get_heatmap(region: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(RiskZone)
    if region:
        stmt = stmt.where(RiskZone.region == region)
    result = await db.execute(stmt)
    zones = result.scalars().all()

    features = [{
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [z.longitude, z.latitude]},
        "properties": {
            "id": str(z.id), "risk_level": z.risk_level,
            "risk_score": round(z.risk_score, 3), "site_name": z.site_name,
            "region": z.region, "rainfall_mm": z.rainfall_mm,
            "temperature_c": z.temperature_c, "ndvi": z.ndvi,
            "humidity_pct": z.humidity_pct,
        },
    } for z in zones]

    return {
        "type": "FeatureCollection", "features": features,
        "metadata": {
            "total_sites": len(features),
            "high_risk": sum(1 for f in features if f["properties"]["risk_level"] == "HIGH"),
            "moderate_risk": sum(1 for f in features if f["properties"]["risk_level"] == "MODERATE"),
            "low_risk": sum(1 for f in features if f["properties"]["risk_level"] == "LOW"),
        },
    }


@router.get("/")
async def list_risk_zones(
    risk_level: Optional[str] = None,
    region: Optional[str] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(RiskZone)
    if risk_level:
        stmt = stmt.where(RiskZone.risk_level == risk_level.upper())
    if region:
        stmt = stmt.where(RiskZone.region == region)
    stmt = stmt.order_by(RiskZone.risk_score.desc()).limit(limit)
    result = await db.execute(stmt)
    zones = result.scalars().all()
    return [{"id": str(z.id), "site_name": z.site_name, "region": z.region,
             "risk_level": z.risk_level, "risk_score": z.risk_score,
             "latitude": z.latitude, "longitude": z.longitude,
             "rainfall_mm": z.rainfall_mm, "temperature_c": z.temperature_c} for z in zones]


@router.get("/{zone_id}")
async def get_risk_zone(zone_id: str, db: AsyncSession = Depends(get_db)):
    zone = await db.get(RiskZone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Risk zone not found")
    return zone
