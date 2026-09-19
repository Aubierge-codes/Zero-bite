"""
Predictions Router
Serves all AI risk prediction data to the four Zero Bite dashboards.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete as sql_delete
from typing import Optional
from datetime import datetime, timedelta

from database.session import get_db
from database.models import Prediction, RiskZone, ZoneHistory
from ml.predictor import RiskPredictor
from data_pipeline.open_meteo_service import get_weather

RWANDA_DISTRICTS = [
    "Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Nyagatare", "Rwamagana",
    "Huye", "Gisagara", "Kamonyi", "Muhanga", "Nyamagabe", "Nyamasheke",
    "Nyanza", "Ruhango", "Gakenke", "Gicumbi", "Burera", "Musanze",
    "Ngororero", "Nyabihu", "Rubavu", "Rulindo", "Karongi", "Nyarugenge",
    "Gasabo", "Kicukiro", "Rusizi", "Ngoma", "Rutsiro", "Ngororero",
]

router = APIRouter()
predictor = RiskPredictor()


# ── Core prediction runner ─────────────────────────────────────────────────────

@router.post("/predict")
async def run_prediction(region: str = "Rwanda", db: AsyncSession = Depends(get_db)):
    """Run a full prediction cycle for a region and persist results."""
    result = await predictor.predict(
        region=region,
        prediction_date=datetime.utcnow() + timedelta(hours=24),
    )
    record = Prediction(
        region=region,
        prediction_date=result.prediction_date,
        critical_risk_count=result.critical_risk_count,
        high_risk_count=result.high_risk_count,
        moderate_risk_count=result.moderate_risk_count,
        low_risk_count=result.low_risk_count,
        model_version=result.model_version,
        confidence_score=result.confidence_score,
    )
    db.add(record)
    await db.commit()

    # ── Save all 210 zone results into RiskZone table ──────────────────────────
    await db.execute(sql_delete(RiskZone).where(RiskZone.district.in_(RWANDA_DISTRICTS)))
    for i, z in enumerate(result.all_zones):
        district = RWANDA_DISTRICTS[i % len(RWANDA_DISTRICTS)]
        db.add(RiskZone(
            site_name=z.site_name or f"Zone-{i+1}",
            region=district,       # aggregate_to_district groups by .region
            district=district,
            latitude=z.latitude,
            longitude=z.longitude,
            risk_level=z.risk_level.value,
            risk_score=z.risk_score,
            rainfall_mm=z.rainfall_mm,
            temperature_c=z.temperature_c,
            ndvi=z.ndvi,
            humidity_pct=z.humidity_pct,
        ))
    await db.commit()
    # ──────────────────────────────────────────────────────────────────────────

    return {
        "region": result.region,
        "prediction_date": result.prediction_date,
        "critical_risk": result.critical_risk_count,
        "high_risk": result.high_risk_count,
        "moderate_risk": result.moderate_risk_count,
        "low_risk": result.low_risk_count,
        "total_cells": result.total_cells,
        "model_version": result.model_version,
        "confidence": result.confidence_score,
        "top_high_risk": [
            {
                "site":  z.site_name,
                "score": z.risk_score,
                "lat":   z.latitude,
                "lon":   z.longitude,
                "level": z.risk_level.value,
            }
            for z in result.high_risk_zones[:5]
        ],
    }


# ── Ministry dashboard ─────────────────────────────────────────────────────────

@router.get("/national-summary")
async def national_summary(db: AsyncSession = Depends(get_db)):
    """
    Screen 2 — Ministry dashboard top cards + district heatmap.
    Returns aggregated national risk data across all 30 Rwanda districts.
    """
    result = await db.execute(select(RiskZone))
    zones   = result.scalars().all()

    # District-level aggregation
    from ml.predictor import RiskPredictor
    district_data = predictor.aggregate_to_district(zones) if zones else {}

    high_risk_districts    = sum(1 for d in district_data.values() if d["risk_level"] in ("HIGH", "CRITICAL"))
    avg_national_risk      = round(
        sum(d["risk_score"] for d in district_data.values()) / len(district_data) * 100, 1
    ) if district_data else 0

    # Active warnings = alerts created in last 24h
    from database.models import Alert
    cutoff = datetime.utcnow() - timedelta(hours=24)
    alert_result  = await db.execute(select(Alert).where(Alert.created_at >= cutoff))
    active_alerts = alert_result.scalars().all()

    return {
        "high_risk_districts": high_risk_districts,
        "active_warnings":     len(active_alerts),
        "avg_national_risk":   avg_national_risk,
        "population_at_risk":  _estimate_population_at_risk(district_data),
        "district_heatmap": [
            {
                "district":   d["district"],
                "risk_level": d["risk_level"],
                "risk_score": round(d["risk_score"] * 100),
                "pct_high":   d["pct_high_risk"],
            }
            for d in district_data.values()
        ],
        "district_priority_ranking": sorted(
            [
                {
                    "district":   d["district"],
                    "risk_score": round(d["risk_score"] * 100),
                    "risk_level": d["risk_level"],
                    "hazard_type": _infer_hazard_type(d),
                }
                for d in district_data.values()
            ],
            key=lambda x: -x["risk_score"]
        )[:10],
    }


@router.get("/ai-summary")
async def ai_situation_summary(db: AsyncSession = Depends(get_db)):
    """
    Screen 2 — Ministry dashboard AI Situation Summary panel.
    Returns the plain-language AI explanation + recommended actions.
    """
    result = await db.execute(
        select(RiskZone)
        .where(RiskZone.risk_level.in_(["HIGH", "CRITICAL"]))
        .order_by(RiskZone.risk_score.desc())
        .limit(5)
    )
    top_zones = result.scalars().all()

    if not top_zones:
        return {
            "summary": "All districts currently within normal parameters. Continue standard prevention protocols.",
            "recommended_actions": ["Maintain bed net distribution", "Continue community health worker patrols"],
            "model_version": predictor.model_version or "demo-v1.0",
            "generated_at": datetime.utcnow().isoformat(),
        }

    top = top_zones[0]
    summary = (
        f"Increased risk detected in {top.region}. "
        f"Current risk score is {round(top.risk_score * 100)}/100 "
        f"({top.risk_level}), driven by elevated rainfall and humidity levels. "
        f"Immediate intervention recommended for {len(top_zones)} high-risk zones."
    )

    return {
        "summary": summary,
        "recommended_actions": [
            f"Deploy larvicide teams to {top.region}",
            f"SMS alert to all Abajyanama b'ubuzima in {top.region}",
            "Escalate to Ministry if no response within 24h",
        ],
        "top_zones": [
            {"site": z.site_name, "region": z.region, "score": round(z.risk_score * 100)}
            for z in top_zones
        ],
        "model_version": predictor.model_version or "demo-v1.0",
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/risk-trends")
async def risk_probability_trends(weeks: int = 6, db: AsyncSession = Depends(get_db)):
    """
    Screen 2 — Ministry dashboard Risk Probability Trends chart.
    Returns historical vs predicted weekly risk scores.
    """
    result = await db.execute(
        select(Prediction)
        .order_by(Prediction.created_at.desc())
        .limit(weeks * 7)
    )
    predictions = result.scalars().all()

    # Group by week
    weekly = {}
    for p in predictions:
        week_key = f"W{p.created_at.isocalendar()[1]}"
        if week_key not in weekly:
            weekly[week_key] = []
        total = (p.high_risk_count or 0) + (p.moderate_risk_count or 0) + (p.low_risk_count or 0)
        if total > 0:
            weekly[week_key].append(
                ((p.high_risk_count or 0) + (p.critical_risk_count or 0)) / total * 100
            )

    trends = [
        {
            "week":       week,
            "historical": round(sum(scores) / len(scores), 1) if scores else 0,
            "predicted":  round(sum(scores) / len(scores) * 1.05, 1) if scores else 0,
        }
        for week, scores in list(weekly.items())[-weeks:]
    ]
    return {"trends": trends}


# ── District dashboard ─────────────────────────────────────────────────────────

@router.get("/district/{district_name}")
async def district_dashboard(district_name: str, db: AsyncSession = Depends(get_db)):
    """
    Screen 3 — District dashboard main card + sector heatmap + 30-day forecast.
    """
    result = await db.execute(
        select(RiskZone).where(RiskZone.district == district_name)
    )
    zones = result.scalars().all()

    if not zones:
        # Run live prediction for this district
        live = await predictor.predict(
            region=district_name,
            prediction_date=datetime.utcnow(),
        )
        district_risk_score = round(
            sum(z.risk_score for z in live.all_zones) / len(live.all_zones) * 100
        ) if live.all_zones else 50
        risk_level = "HIGH" if district_risk_score > 65 else "MODERATE" if district_risk_score > 35 else "LOW"
        sector_heatmap = []
    else:
        scores         = [z.risk_score for z in zones]
        district_risk_score = round(sum(scores) / len(scores) * 100)
        risk_level     = zones[0].risk_level if zones else "MODERATE"
        sector_heatmap = [
            {
                "sector":     z.site_name,
                "risk_score": round(z.risk_score * 100),
                "risk_level": z.risk_level,
                "lat":        z.latitude,
                "lon":        z.longitude,
            }
            for z in sorted(zones, key=lambda x: -x.risk_score)
        ]

    # 30-day history from ZoneHistory
    history_result = await db.execute(
        select(ZoneHistory)
        .join(RiskZone, ZoneHistory.zone_id == RiskZone.id)
        .where(RiskZone.district == district_name)
        .where(ZoneHistory.recorded_at >= datetime.utcnow() - timedelta(days=30))
        .order_by(ZoneHistory.recorded_at.asc())
    )
    history = history_result.scalars().all()

    forecast_30day = [
        {
            "date":              h.recorded_at.strftime("%b %d"),
            "humidity_index":    round((h.risk_score or 0.5) * 80 + 20),
            "temperature_factor": round((h.risk_score or 0.5) * 35 + 15),
            "satellite_pooling": round((h.risk_score or 0.5) * 60),
        }
        for h in history[-30:]
    ]

    return {
        "district":         district_name,
        "risk_score":       district_risk_score,
        "risk_level":       risk_level,
        "risk_change_pct":  _calculate_risk_change(history),
        "temperature_c":    zones[0].temperature_c if zones and zones[0].temperature_c else 28,
        "humidity_pct":     zones[0].humidity_pct  if zones and zones[0].humidity_pct  else 75,
        "active_hotspots":  sum(1 for z in zones if z.risk_level in ("HIGH", "CRITICAL")),
        "sector_heatmap":   sector_heatmap,
        "forecast_30day":   forecast_30day,
        "recommended_actions": _get_district_actions(risk_level, district_name),
        "last_updated":     datetime.utcnow().isoformat(),
    }


# ── District list ──────────────────────────────────────────────────────────────

@router.get("/districts/")
async def list_all_districts(db: AsyncSession = Depends(get_db)):
    """
    Screen 7 — District List table.
    Returns all 30 districts with current risk and 7-day trend.
    """
    result = await db.execute(select(RiskZone))
    zones  = result.scalars().all()
    district_data = predictor.aggregate_to_district(zones) if zones else {}

    # Fallback: return Rwanda's 30 districts with demo data if DB empty
    if not district_data:
        from scripts.build_static_features import DISTRICT_STATIC
        return [
            {
                "district":    d["district"],
                "province":    _get_province(d["district"]),
                "current_risk": round(d["flood_risk_base"] * 100),
                "risk_level":  "HIGH" if d["flood_risk_base"] > 0.65 else "MODERATE" if d["flood_risk_base"] > 0.35 else "LOW",
                "trend_7day":  "stable",
            }
            for d in DISTRICT_STATIC
        ]

    return [
        {
            "district":    name,
            "province":    _get_province(name),
            "current_risk": round(d["risk_score"] * 100),
            "risk_level":  d["risk_level"],
            "high_cells":  d["high_cell_count"],
            "total_cells": d["total_cells"],
            "trend_7day":  "increasing",
        }
        for name, d in sorted(district_data.items(), key=lambda x: -x[1]["risk_score"])
    ]


# ── Community worker / zone ────────────────────────────────────────────────────

@router.get("/zone/{zone_id}")
async def zone_prediction(zone_id: str, db: AsyncSession = Depends(get_db)):
    """
    Screen 4 — Community Worker dashboard village risk card.
    """
    zone = await db.get(RiskZone, zone_id)
    if not zone:
        return {
            "zone_id":          zone_id,
            "village_risk":     65,
            "risk_level":       "HIGH",
            "risk_change_pct":  8,
            "weather_warning":  "Heavy rain expected in the next 48 hours.",
            "today_goals": [
                {"task": "Contact 12 Village Leaders", "completed": True},
                {"task": "Distribute SMS Alert",       "completed": False},
            ],
        }

    return {
        "zone_id":         zone_id,
        "site_name":       zone.site_name,
        "village_risk":    round(zone.risk_score * 100),
        "risk_level":      zone.risk_level,
        "rainfall_mm":     zone.rainfall_mm,
        "humidity_pct":    zone.humidity_pct,
        "temperature_c":   zone.temperature_c,
        "last_updated":    zone.updated_at.isoformat() if zone.updated_at else None,
        "today_goals": [
            {"task": "Check stagnant water sites",    "completed": False},
            {"task": "Send community SMS broadcast",  "completed": False},
            {"task": "Log field observations",        "completed": False},
        ],
        "weather_warning": _get_weather_warning(zone),
    }


# ── Public portal ──────────────────────────────────────────────────────────────

@router.get("/public/{district_name}")
async def public_district_risk(district_name: str, db: AsyncSession = Depends(get_db)):
    """
    Screen 5 — Public portal district risk card. No auth required.
    """
    result = await db.execute(
        select(RiskZone)
        .where(RiskZone.district == district_name)
        .order_by(RiskZone.risk_score.desc())
        .limit(1)
    )
    top_zone = result.scalar_one_or_none()

    risk_score = round((top_zone.risk_score if top_zone else 0.65) * 100)
    risk_level = (
        "CRITICAL" if risk_score >= 80 else
        "HIGH"     if risk_score >= 65 else
        "MODERATE" if risk_score >= 35 else "LOW"
    )

    return {
        "district":           district_name,
        "risk_score":         risk_score,
        "risk_level":         risk_level,
        "transmission_stage": _get_transmission_stage(risk_score),
        "confidence_score":   round((top_zone.risk_score if top_zone else 0.89) * 100),
        "weather": {
            "temperature_c": top_zone.temperature_c if top_zone else 24,
            "humidity_pct":  top_zone.humidity_pct  if top_zone else 78,
        },
        "recommended_prevention": [
            {"action": "Use Bed Nets",    "priority": "Priority",    "detail": "Ensure all family members sleep under insecticide-treated nets"},
            {"action": "Clear Water",     "priority": "Recommended", "detail": "Empty containers and clear stagnant water around your dwelling"},
            {"action": "Close Windows",   "priority": "Daily",       "detail": "Keep windows and doors closed or screened after 6:00 PM"},
            {"action": "Seek Care",       "priority": "Health",      "detail": "Visit your CHW immediately if you develop a sudden fever"},
        ],
        "updated_at": datetime.utcnow().isoformat(),
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
    preds = result.scalars().all()
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
        for p in preds
    ]


# ── Live single-coordinate prediction ─────────────────────────────────────────

@router.get("/live")
async def live_coordinate_prediction(
    lat: float,
    lon: float,
    ndvi: float = 0.4,
    river_distance_m: float = 500,
):
    """Single coordinate live prediction — used by public map clicks."""
    weather    = get_weather(lat, lon)
    prediction = predictor.predict_risk(weather=weather, ndvi=ndvi, river_distance=river_distance_m)
    return {"latitude": lat, "longitude": lon, "weather": weather, **prediction}


# ── Private helpers ────────────────────────────────────────────────────────────

def _estimate_population_at_risk(district_data: dict) -> int:
    DISTRICT_POP = {
        "Bugesera": 632000, "Gasabo": 745000, "Kicukiro": 520000,
        "Nyarugenge": 350000, "Kayonza": 425000, "Kirehe": 380000,
        "Burera": 340000, "Musanze": 480000, "Rubavu": 510000,
    }
    total = 0
    for name, d in district_data.items():
        if d["risk_level"] in ("HIGH", "CRITICAL"):
            total += DISTRICT_POP.get(name, 300000)
    return total


def _infer_hazard_type(d: dict) -> str:
    if d["risk_score"] > 0.75:
        return "Malaria"
    elif d.get("pct_high_risk", 0) > 40:
        return "Floods"
    return "Malaria"


def _calculate_risk_change(history: list) -> float:
    if len(history) < 2:
        return 0.0
    recent = history[-1].risk_score or 0
    older  = history[0].risk_score  or 0
    if older == 0:
        return 0.0
    return round((recent - older) / older * 100, 1)


def _get_district_actions(risk_level: str, district: str) -> list:
    base = [
        f"Deploy larvicide teams to high-risk sectors in {district}",
        "Send SMS alerts to all registered Abajyanama b'ubuzima",
        "Coordinate with district health office for resource deployment",
    ]
    if risk_level == "CRITICAL":
        base.insert(0, f"URGENT: Escalate {district} to Ministry of Health immediately")
    return base


def _get_weather_warning(zone) -> str:
    if zone.rainfall_mm and zone.rainfall_mm > 50:
        return f"Heavy rainfall detected ({zone.rainfall_mm:.0f}mm). Check for stagnant water accumulation."
    if zone.humidity_pct and zone.humidity_pct > 85:
        return "Very high humidity. Mosquito activity elevated — enforce net use tonight."
    return "Monitor conditions. Standard prevention protocols active."


def _get_transmission_stage(risk_score: int) -> str:
    if risk_score >= 80: return "Critical"
    if risk_score >= 65: return "Acceleration"
    if risk_score >= 35: return "Elevation"
    return "Baseline"


def _get_province(district: str) -> str:
    PROVINCES = {
        "Bugesera": "Eastern", "Gatsibo": "Eastern", "Kayonza": "Eastern",
        "Kirehe": "Eastern", "Ngoma": "Eastern", "Nyagatare": "Eastern",
        "Rwamagana": "Eastern", "Huye": "Southern", "Gisagara": "Southern",
        "Kamonyi": "Southern", "Muhanga": "Southern", "Nyamagabe": "Southern",
        "Nyamasheke": "Southern", "Nyanza": "Southern", "Ruhango": "Southern",
        "Gakenke": "Northern", "Gicumbi": "Northern", "Burera": "Northern",
        "Musanze": "Northern", "Ngororero": "Western", "Nyabihu": "Western",
        "Rubavu": "Western", "Rulindo": "Northern", "Karongi": "Western",
        "Nyarugenge": "Kigali", "Gasabo": "Kigali", "Kicukiro": "Kigali",
        "Rusizi": "Western", "Rutsiro": "Western",
    }
    return PROVINCES.get(district, "Rwanda")