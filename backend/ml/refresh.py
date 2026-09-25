"""
Prediction refresh
Runs the model over today's real weather and persists the results
(RiskZone, ZoneHistory, Prediction, Alert, ActivityLog) so every dashboard,
alert inbox and history view reads one consistent, real dataset.
"""

import asyncio
from datetime import datetime, timedelta

from loguru import logger
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from alerts.sms_broadcast import broadcast, subscribers
from database.models import Alert, ActivityLog, Prediction, RiskZone, ZoneHistory
from ml.runtime import engine, predictor

STALE_AFTER = timedelta(hours=1)
_refresh_lock = asyncio.Lock()


def _reason(day: dict) -> str:
    return (
        f"Model risk score {round(day['risk_score'] * 100)}/100. "
        f"Rainfall {day['rainfall_mm']:.1f} mm, humidity {day['humidity_pct']:.0f}%, "
        f"temperature {day['temperature_c']:.1f}°C, soil moisture index {day['soil_moisture']:.2f}."
    )


async def refresh_predictions(db: AsyncSession, force_weather: bool = False) -> dict:
    """Fetch real weather, predict every district, persist. Returns a summary."""
    async with _refresh_lock:
        snap  = await engine.snapshot(force=force_weather)
        today = await engine.today()
        now   = datetime.utcnow()

        existing = {
            (z.district, z.site_name): z
            for z in (await db.execute(select(RiskZone))).scalars().all()
        }

        counts = {"CRITICAL": 0, "HIGH": 0, "MODERATE": 0, "LOW": 0}
        confidences, zones = [], []

        for district, day in today.items():
            counts[day["risk_level"]] += 1
            confidences.append(day["confidence"])
            site = f"{district} District"
            zone = existing.get((district, site))
            if zone is None:
                zone = RiskZone(site_name=site, region=district, district=district,
                                latitude=day["latitude"], longitude=day["longitude"],
                                risk_level=day["risk_level"], risk_score=day["risk_score"])
                db.add(zone)
            zone.risk_level         = day["risk_level"]
            zone.risk_score         = day["risk_score"]
            zone.rainfall_mm        = day["rainfall_mm"]
            zone.temperature_c      = day["temperature_c"]
            zone.ndvi               = day["ndvi"]
            zone.humidity_pct       = day["humidity_pct"]
            zone.soil_moisture      = day["soil_moisture"]
            zone.river_buffer_m     = day["river_buffer_m"]
            zone.depression_index   = day["depression_index"]
            zone.flood_risk_index   = day["flood_risk_index"]
            zone.standing_water_km2 = day["standing_water_km2"]
            zone.sunshine_hours     = day["sunshine_hours"]
            zone.population_density = day["population_density"]
            zone.season_weight      = day["season_weight"]
            zone.updated_at         = now
            zones.append((zone, day))
        await db.flush()

        new_alerts, to_notify = 0, []
        day_ago = now - timedelta(hours=24)
        for zone, day in zones:
            db.add(ZoneHistory(zone_id=zone.id, risk_score=zone.risk_score,
                               risk_level=zone.risk_level, rainfall_mm=zone.rainfall_mm,
                               recorded_at=now))
            if day["risk_level"] in ("HIGH", "CRITICAL"):
                recent = (await db.execute(
                    select(func.count()).select_from(Alert).where(
                        Alert.zone_id == zone.id, Alert.status == "active",
                        Alert.created_at >= day_ago)
                )).scalar_one()
                if not recent:
                    db.add(Alert(zone_id=zone.id, risk_level=day["risk_level"],
                                 region=zone.district, site_name=zone.site_name,
                                 trigger_reason=_reason(day), status="active"))
                    new_alerts += 1
                    to_notify.append((zone.district, day))

        avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
        db.add(Prediction(region="Rwanda", prediction_date=now, critical_risk_count=counts["CRITICAL"],
                          high_risk_count=counts["HIGH"], moderate_risk_count=counts["MODERATE"],
                          low_risk_count=counts["LOW"], model_version=predictor.model_version,
                          confidence_score=round(avg_conf, 4)))
        db.add(ActivityLog(
            event_type="prediction_run",
            description=(f"Prediction cycle on live Open-Meteo weather: {counts['CRITICAL']} critical, "
                         f"{counts['HIGH']} high, {counts['MODERATE']} moderate, {counts['LOW']} low "
                         f"districts; {new_alerts} new alert(s)."),
        ))
        await db.commit()
        for district, day in to_notify:
            try:
                subs = await subscribers(db, [district])
                if subs:
                    await broadcast(subs, (
                        f"Zero Bite: {day['risk_level']} malaria risk in {district} today "
                        f"({round(day['risk_score'] * 100)}/100). Sleep under a treated net and clear "
                        "standing water. Reply STOP to unsubscribe."), db)
            except Exception as exc:  # SMS is best-effort; never fail a prediction run
                logger.warning(f"Subscriber SMS for {district} failed: {exc}")
        logger.info(f"Predictions refreshed: {counts}, {new_alerts} new alerts")
        return {"counts": counts, "new_alerts": new_alerts, "districts": len(zones),
                "confidence": round(avg_conf, 4), "model_version": predictor.model_version}


async def ensure_fresh(db: AsyncSession) -> None:
    """Refresh if there are no zones yet or they are older than STALE_AFTER."""
    latest = (await db.execute(select(func.max(RiskZone.updated_at)))).scalar_one_or_none()
    if latest is None or datetime.utcnow() - latest > STALE_AFTER:
        await refresh_predictions(db)
