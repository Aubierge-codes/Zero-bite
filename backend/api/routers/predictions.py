"""
Predictions Router
Serves real AI risk predictions to the four Zero Bite dashboards.

All numbers come from the trained model run over live Open-Meteo weather for
Rwanda's 30 districts (see ml/risk_engine.py). Nothing here is hardcoded or
randomly generated; if a district has no data the API says so (404/503).
"""

import asyncio
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from data_pipeline.open_meteo_service import get_weather
from data_pipeline.rwanda_districts import DISTRICT_INFO, canonical_district
from database.models import Alert, Prediction, RiskZone
from database.session import get_db
from ml.refresh import ensure_fresh, refresh_predictions
from ml.runtime import engine, predictor

router = APIRouter()


def _pct(score: float) -> int:
    return round(score * 100)


def _iso_utc(dt) -> str:
    return (dt or datetime.utcnow()).isoformat() + "Z"


def _district_or_404(name: str) -> str:
    district = canonical_district(name)
    if not district:
        raise HTTPException(status_code=404, detail=f"Unknown district '{name}'")
    return district


# ── Core prediction runner ─────────────────────────────────────────────────────

@router.post("/predict")
async def run_prediction(region: str = "Rwanda", db: AsyncSession = Depends(get_db)):
    """Re-fetch live weather, run the model for all 30 districts and persist results."""
    summary = await refresh_predictions(db, force_weather=True)
    today = await engine.today()
    ranked = sorted(today.values(), key=lambda d: -d["risk_score"])
    return {
        "region":          "Rwanda",
        "prediction_date": datetime.utcnow(),
        "critical_risk":   summary["counts"]["CRITICAL"],
        "high_risk":       summary["counts"]["HIGH"],
        "moderate_risk":   summary["counts"]["MODERATE"],
        "low_risk":        summary["counts"]["LOW"],
        "total_cells":     summary["districts"],
        "model_version":   summary["model_version"],
        "confidence":      summary["confidence"],
        "new_alerts":      summary["new_alerts"],
        "top_high_risk": [
            {"site": d["site_name"], "score": _pct(d["risk_score"]),
             "lat": d["latitude"], "lon": d["longitude"], "level": d["risk_level"]}
            for d in ranked if d["risk_level"] in ("HIGH", "CRITICAL")
        ][:5],
    }


# ── Ministry dashboard ─────────────────────────────────────────────────────────

def _hazard_type(day: dict) -> str:
    """Dominant hazard driving the district's risk, from its real conditions."""
    if day["flood_risk_index"] >= 0.6 or day["rainfall_mm"] >= 40:
        return "Floods"
    if day["temperature_c"] >= 30:
        return "Heatwave"
    return "Malaria"


@router.get("/national-summary")
async def national_summary(db: AsyncSession = Depends(get_db)):
    """Ministry dashboard KPI cards, district heatmap and priority ranking."""
    await ensure_fresh(db)
    today = await engine.today()
    if not today:
        raise HTTPException(status_code=503, detail="No prediction data available yet")

    days = list(today.values())
    avg_now = sum(d["risk_score"] for d in days) / len(days) * 100

    # Same average one week ago, from the model run over observed weather.
    snap = await engine.snapshot()
    week_ago = []
    for series in snap.values():
        d = engine._day(series, -7)
        if d:
            week_ago.append(d["risk_score"])
    avg_before = sum(week_ago) / len(week_ago) * 100 if week_ago else None

    cutoff = datetime.utcnow() - timedelta(hours=24)
    active = (await db.execute(
        select(Alert).where(Alert.created_at >= cutoff, Alert.status == "active")
    )).scalars().all()

    rising = 0
    for name in today:
        if await engine.trend_label(name) == "Increasing":
            rising += 1

    ranking = sorted(days, key=lambda d: -d["risk_score"])
    return {
        "high_risk_districts": sum(1 for d in days if d["risk_level"] in ("HIGH", "CRITICAL")),
        "critical_districts":  sum(1 for d in days if d["risk_level"] == "CRITICAL"),
        "active_warnings":     len(active),
        "avg_national_risk":   round(avg_now, 1),
        "avg_risk_change_pts": round(avg_now - avg_before, 1) if avg_before is not None else None,
        "rising_districts":    rising,
        "district_heatmap": [
            {"district": d["district"], "risk_level": d["risk_level"],
             "risk_score": _pct(d["risk_score"]),
             "pct_high": 100.0 if d["risk_level"] in ("HIGH", "CRITICAL") else 0.0}
            for d in days
        ],
        "district_priority_ranking": [
            {"district": d["district"], "risk_score": _pct(d["risk_score"]),
             "risk_level": d["risk_level"], "hazard_type": _hazard_type(d)}
            for d in ranking[:10]
        ],
    }


@router.get("/ai-summary")
async def ai_situation_summary(db: AsyncSession = Depends(get_db)):
    """Plain-language situation summary generated from today's real model output."""
    await ensure_fresh(db)
    today = await engine.today()
    if not today:
        raise HTTPException(status_code=503, detail="No prediction data available yet")

    ranked = sorted(today.values(), key=lambda d: -d["risk_score"])
    high = [d for d in ranked if d["risk_level"] in ("HIGH", "CRITICAL")]
    avg_rain = sum(d["rainfall_mm"] for d in ranked) / len(ranked)
    avg_hum = sum(d["humidity_pct"] for d in ranked) / len(ranked)

    if not high:
        top = ranked[0]
        summary = (
            f"No district is currently at high risk. The highest is {top['district']} at "
            f"{_pct(top['risk_score'])}/100 ({top['risk_level']}). National averages: "
            f"{avg_rain:.1f} mm rainfall and {avg_hum:.0f}% humidity."
        )
        actions = ["Maintain bed net distribution", "Continue community health worker patrols"]
    else:
        top = high[0]
        names = ", ".join(d["district"] for d in high[:3])
        summary = (
            f"{len(high)} district(s) at HIGH or CRITICAL risk, led by {top['district']} at "
            f"{_pct(top['risk_score'])}/100. Driving conditions there: {top['rainfall_mm']:.1f} mm rainfall, "
            f"{top['humidity_pct']:.0f}% humidity, {top['temperature_c']:.1f}°C. Priority districts: {names}."
        )
        actions = [
            f"Deploy larvicide teams to {top['district']} — risk {_pct(top['risk_score'])}/100 ({top['risk_level']}).",
            f"SMS alert to community health workers in {names}.",
        ]
        if len(high) > 3:
            actions.append(f"Escalate to Ministry — {len(high)} districts are above the HIGH threshold.")

    return {
        "summary":             summary,
        "recommended_actions": actions,
        "top_zones": [{"site": d["site_name"], "region": d["district"], "score": _pct(d["risk_score"])}
                      for d in high[:5]],
        "model_version":       predictor.model_version,
        "generated_at":        _iso_utc(None),
    }


@router.get("/risk-trends")
async def risk_probability_trends(weeks: int = 6):
    """Weekly national risk: observed-weather history and forecast-weather prediction."""
    weeks = max(1, min(weeks, 8))
    return {"trends": await engine.national_weekly(weeks=weeks)}


# ── District dashboard ─────────────────────────────────────────────────────────

def _district_actions(day: dict, district: str) -> list:
    actions = []
    if day["risk_level"] == "CRITICAL":
        actions.append(f"URGENT: Escalate {district} to the Ministry of Health")
    if day["risk_level"] in ("HIGH", "CRITICAL"):
        actions.append(f"Deploy larvicide teams to breeding sites in {district}")
        actions.append("Send SMS alerts to all registered community health workers")
    if day["rainfall_mm"] >= 20 or day["soil_moisture"] >= 0.6:
        actions.append("Inspect and drain standing water after recent rainfall")
    if day["humidity_pct"] >= 80:
        actions.append("Reinforce bed-net use — humidity favours mosquito activity")
    if not actions:
        actions.append("Maintain routine prevention and surveillance")
    return actions


@router.get("/district/{district_name}")
async def district_dashboard(district_name: str, db: AsyncSession = Depends(get_db)):
    """District dashboard: today's risk, environmental drivers and a 30-day risk series."""
    district = _district_or_404(district_name)
    await ensure_fresh(db)
    day = await engine.district_today(district)
    if not day:
        raise HTTPException(status_code=503, detail="No prediction data available yet")

    series = await engine.series(district, past=14, ahead=16)
    today_iso = day["date"]
    ahead = [d for d in series if d["date"] > today_iso][:7]

    return {
        "district":        district,
        "province":        DISTRICT_INFO[district]["province"],
        "risk_score":      _pct(day["risk_score"]),
        "risk_level":      day["risk_level"],
        "risk_change_pts": await engine.risk_change_pts(district),
        "temperature_c":   round(day["temperature_c"], 1),
        "humidity_pct":    round(day["humidity_pct"]),
        "rainfall_mm":     round(day["rainfall_mm"], 1),
        "soil_moisture":   round(day["soil_moisture"], 2),
        "standing_water_index": round(day["standing_water_km2"], 2),
        "flood_risk_index": round(day["flood_risk_index"], 2),
        "confidence":      round(day["confidence"] * 100),
        "high_risk_days_ahead": sum(1 for d in ahead if d["risk_level"] in ("HIGH", "CRITICAL")),
        "forecast_30day": [
            {
                "date":          d["date"],
                "risk_score":    _pct(d["risk_score"]),
                "rainfall_mm":   round(d["rainfall_mm"], 1),
                "humidity_pct":  round(d["humidity_pct"]),
                "temperature_c": round(d["temperature_c"], 1),
                "is_forecast":   d["date"] > today_iso,
            }
            for d in series
        ],
        "recommended_actions": _district_actions(day, district),
        "model_version":   predictor.model_version,
        "last_updated":    _iso_utc(engine.fetched_at),
    }


# ── District list ──────────────────────────────────────────────────────────────

@router.get("/districts/")
async def list_all_districts(db: AsyncSession = Depends(get_db)):
    """District list: all 30 districts with today's risk and the real 7-day trend."""
    await ensure_fresh(db)
    today = await engine.today()
    if not today:
        raise HTTPException(status_code=503, detail="No prediction data available yet")

    out = []
    for name, day in sorted(today.items(), key=lambda x: -x[1]["risk_score"]):
        out.append({
            "district":     name,
            "province":     DISTRICT_INFO[name]["province"],
            "current_risk": _pct(day["risk_score"]),
            "risk_level":   day["risk_level"],
            "trend_7day":   await engine.trend_label(name),
        })
    return out


# ── Community worker / zone ────────────────────────────────────────────────────

def _weather_warning(day: dict, ahead: list) -> str:
    wet = [d for d in ahead[:3] if d["rainfall_mm"] >= 10]
    if wet:
        total = sum(d["rainfall_mm"] for d in ahead[:3])
        return (f"Rain forecast in the next 3 days ({total:.0f} mm total). "
                "Check for stagnant water accumulation and close open water logs.")
    if day["rainfall_mm"] >= 20:
        return f"Heavy rainfall recorded today ({day['rainfall_mm']:.0f} mm). Check for stagnant water."
    if day["humidity_pct"] >= 85:
        return "Very high humidity. Mosquito activity is elevated — enforce net use tonight."
    return "No significant weather threat in the next 3 days. Standard prevention protocols apply."


@router.get("/zone/{zone_id}")
async def zone_prediction(zone_id: str, db: AsyncSession = Depends(get_db)):
    """Community worker dashboard: risk for a zone (a district cell) with a weather warning."""
    zone = await db.get(RiskZone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    day = await engine.district_today(zone.district)
    if not day:
        raise HTTPException(status_code=503, detail="No prediction data available yet")
    series = await engine.series(zone.district, past=0, ahead=5)
    ahead = [d for d in series if d["date"] > day["date"]]

    tasks = ["Check stagnant water sites", "Send community SMS broadcast", "Log field observations"]
    if day["risk_level"] in ("HIGH", "CRITICAL"):
        tasks.insert(0, "Visit the highest-risk breeding sites today")

    return {
        "zone_id":         zone_id,
        "site_name":       zone.site_name,
        "district":        zone.district,
        "village_risk":    _pct(day["risk_score"]),
        "risk_level":      day["risk_level"],
        "risk_change_pts": await engine.risk_change_pts(zone.district),
        "rainfall_mm":     round(day["rainfall_mm"], 1),
        "humidity_pct":    round(day["humidity_pct"]),
        "temperature_c":   round(day["temperature_c"], 1),
        "last_updated":    _iso_utc(engine.fetched_at),
        "today_goals":     [{"task": t, "completed": False} for t in tasks],
        "weather_warning": _weather_warning(day, ahead),
    }


# ── Public portal ──────────────────────────────────────────────────────────────

def _prevention(level: str) -> list:
    urgent = level in ("HIGH", "CRITICAL")
    return [
        {"action": "Use Bed Nets",  "priority": "Priority" if urgent else "Recommended",
         "detail": "Ensure all family members sleep under insecticide-treated nets."},
        {"action": "Clear Water",   "priority": "High" if urgent else "Recommended",
         "detail": "Empty containers and clear stagnant water around your dwelling."},
        {"action": "Close Windows", "priority": "Daily",
         "detail": "Keep windows and doors closed or screened after 6:00 PM."},
        {"action": "Seek Care",     "priority": "Health",
         "detail": "Visit your community health worker immediately if you develop a sudden fever."},
    ]


def _stage(score: int) -> str:
    if score >= 80: return "Critical"
    if score >= 65: return "Acceleration"
    if score >= 35: return "Elevation"
    return "Baseline"


@router.get("/public/{district_name}")
async def public_district_risk(district_name: str):
    """Public portal district risk card. No auth required."""
    district = _district_or_404(district_name)
    day = await engine.district_today(district)
    if not day:
        raise HTTPException(status_code=503, detail="No prediction data available yet")

    score = _pct(day["risk_score"])
    series = await engine.series(district, past=0, ahead=3)
    ahead = [d for d in series if d["date"] > day["date"]]
    change = await engine.risk_change_pts(district)
    direction = "up" if change > 0 else "down" if change < 0 else "unchanged"
    delta = f" {abs(change):.0f} points" if change else ""

    return {
        "district":           district,
        "risk_score":         score,
        "risk_level":         day["risk_level"],
        "transmission_stage": _stage(score),
        "confidence_score":   round(day["confidence"] * 100),
        "weather": {
            "temperature_c": round(day["temperature_c"], 1),
            "humidity_pct":  round(day["humidity_pct"]),
        },
        "rainfall_mm": round(day["rainfall_mm"], 1),
        "summary": (
            f"Malaria breeding risk in {district} is {day['risk_level']} ({score}/100), "
            f"{direction}{delta} versus a week ago. "
            f"Today: {day['rainfall_mm']:.1f} mm rain, {day['humidity_pct']:.0f}% humidity."
        ),
        "weather_note": _weather_warning(day, ahead),
        "recommended_prevention": _prevention(day["risk_level"]),
        "updated_at": _iso_utc(engine.fetched_at),
    }


# ── Prediction history ─────────────────────────────────────────────────────────

@router.get("/history")
async def prediction_history(days: int = 7, db: AsyncSession = Depends(get_db)):
    cutoff = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(Prediction)
        .where(Prediction.created_at >= cutoff)
        .order_by(Prediction.created_at.desc())
    )
    return [
        {
            "id":             str(p.id),
            "region":         p.region,
            "critical_risk":  p.critical_risk_count,
            "high_risk":      p.high_risk_count,
            "moderate_risk":  p.moderate_risk_count,
            "low_risk":       p.low_risk_count,
            "model_version":  p.model_version,
            "created_at":     p.created_at,
        }
        for p in result.scalars().all()
    ]


# ── Live single-coordinate prediction ─────────────────────────────────────────

@router.get("/live")
async def live_coordinate_prediction(
    lat: float,
    lon: float,
    ndvi: float = 0.4,
    river_distance_m: float = 500,
):
    """Single coordinate live prediction from real Open-Meteo weather."""
    try:
        weather = await asyncio.to_thread(get_weather, lat, lon)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Live weather unavailable: {exc}")
    prediction = predictor.predict_risk(weather=weather, ndvi=ndvi, river_distance=river_distance_m)
    return {"latitude": lat, "longitude": lon, "weather": weather, **prediction}
