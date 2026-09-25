"""
Reports Router
Builds report data from the real model output (observed-weather risk history) and
the operational tables (alerts, field treatments, SMS log). Nothing is invented:
if a period has no field data the corresponding figures come back as zero/null.
"""

from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from data_pipeline.rwanda_districts import DISTRICT_INFO, DISTRICT_NAMES, canonical_district
from database.models import Alert, SmsLog, TreatmentRecord
from database.session import get_db
from ml.feature_extractor import PAST_DAYS, kigali_today
from ml.runtime import engine, predictor

router = APIRouter()


def _avg(values) -> Optional[float]:
    values = list(values)
    return sum(values) / len(values) if values else None


@router.get("/summary")
async def report_summary(
    start: Optional[date] = None,
    end: Optional[date] = None,
    districts: str = "",
    db: AsyncSession = Depends(get_db),
):
    today = kigali_today()
    earliest = today - timedelta(days=PAST_DAYS)
    end = min(end or today, today)
    start = max(start or end - timedelta(days=29), earliest)
    if start > end:
        raise HTTPException(status_code=422, detail=f"Choose a range between {earliest} and {today}.")

    names = [canonical_district(d) for d in districts.split(",") if d.strip()]
    if any(n is None for n in names):
        raise HTTPException(status_code=422, detail="Unknown district in filter")
    names = names or list(DISTRICT_NAMES)

    snap = await engine.snapshot()
    s_iso, e_iso = start.isoformat(), end.isoformat()
    length = (end - start).days + 1
    prev_start, prev_end = start - timedelta(days=length), start - timedelta(days=1)

    rows = []
    for name in names:
        days = [d for d in snap.get(name, []) if s_iso <= d["date"] <= e_iso]
        if not days:
            continue
        last = days[-1]
        rows.append({
            "district":      name,
            "province":      DISTRICT_INFO[name]["province"],
            "avg_risk":      round(_avg(d["risk_score"] for d in days) * 100, 1),
            "peak_risk":     round(max(d["risk_score"] for d in days) * 100),
            "latest_risk":   round(last["risk_score"] * 100),
            "latest_level":  last["risk_level"],
            "days_high":     sum(1 for d in days if d["risk_level"] in ("HIGH", "CRITICAL")),
            "total_rain_mm": round(sum(d["rainfall_mm"] for d in days), 1),
            "avg_temp_c":    round(_avg(d["temperature_c"] for d in days), 1),
            "avg_humidity":  round(_avg(d["humidity_pct"] for d in days)),
            "avg_flood_risk": round(_avg(d["flood_risk_index"] for d in days), 2),
        })
    if not rows:
        raise HTTPException(status_code=503, detail="No weather/risk data available for that period yet")
    rows.sort(key=lambda r: -r["avg_risk"])

    # Previous period average (same districts) for the change figure
    prev_scores = [d["risk_score"] for n in names for d in snap.get(n, [])
                   if prev_start.isoformat() <= d["date"] <= prev_end.isoformat()]
    avg_now = _avg(r["avg_risk"] for r in rows)
    avg_prev = round(_avg(prev_scores) * 100, 1) if prev_scores else None

    # Weekly national trend inside the window
    trend, cursor, week = [], start, 1
    while cursor <= end:
        wk_end = min(cursor + timedelta(days=6), end)
        scores = [d["risk_score"] for n in names for d in snap.get(n, [])
                  if cursor.isoformat() <= d["date"] <= wk_end.isoformat()]
        if scores:
            trend.append({"week": cursor.strftime("%b %d"), "avg_risk": round(_avg(scores) * 100, 1)})
        cursor, week = wk_end + timedelta(days=1), week + 1

    counts = {lvl: sum(1 for r in rows if r["latest_level"] == lvl) for lvl in ("CRITICAL", "HIGH", "MODERATE", "LOW")}

    # Operational data in the same window
    lo, hi = datetime.combine(start, datetime.min.time()), datetime.combine(end, datetime.max.time())
    alert_rows = (await db.execute(
        select(Alert.risk_level, func.count()).where(Alert.created_at.between(lo, hi)).group_by(Alert.risk_level)
    )).all()
    treated = (await db.execute(
        select(TreatmentRecord).where(TreatmentRecord.treated_at.between(lo, hi))
    )).scalars().all()
    measured = [t for t in treated if t.larvae_count_before and t.larvae_count_after is not None]
    sms_delivered = (await db.execute(
        select(func.count()).select_from(SmsLog).where(SmsLog.created_at.between(lo, hi), SmsLog.status == "delivered")
    )).scalar_one()

    top = rows[0]
    change_txt = ""
    if avg_prev:
        pct = (avg_now - avg_prev) / avg_prev * 100
        change_txt = f" This is {abs(pct):.1f}% {'higher' if pct > 0 else 'lower'} than the preceding {length} days ({avg_prev}/100)."
    summary = (
        f"Between {start:%b %d, %Y} and {end:%b %d, %Y}, the model-estimated malaria breeding risk averaged "
        f"{avg_now:.1f}/100 across {len(rows)} district(s).{change_txt} "
        f"{top['district']} recorded the highest average risk ({top['avg_risk']}/100, peak {top['peak_risk']}) "
        f"with {top['total_rain_mm']} mm of rainfall in the period. "
        f"As of {end:%b %d}, {counts['CRITICAL'] + counts['HIGH']} district(s) are at HIGH or CRITICAL risk."
    )

    return {
        "report_id":    f"ZB-{end:%Y%m%d}-{len(rows):02d}",
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "period":       {"start": s_iso, "end": e_iso, "days": length},
        "available":    {"from": earliest.isoformat(), "to": today.isoformat()},
        "model_version": predictor.model_version,
        "totals": {
            "districts": len(rows),
            "avg_risk": round(avg_now, 1),
            "previous_avg_risk": avg_prev,
            "by_level": counts,
        },
        "executive_summary": summary,
        "districts": rows,
        "weekly_trend": trend,
        "operations": {
            "alerts_by_level": {lvl: n for lvl, n in alert_rows},
            "alerts_total": sum(n for _, n in alert_rows),
            "sites_treated": len(treated),
            "larvicide_ml": round(sum(t.larvicide_ml_used or 0 for t in treated), 1),
            "avg_larvae_reduction_pct": round(
                _avg((t.larvae_count_before - t.larvae_count_after) / t.larvae_count_before for t in measured) * 100
            ) if measured else None,
            "sms_delivered": sms_delivered,
        },
    }
