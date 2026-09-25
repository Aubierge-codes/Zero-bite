"""
Risk Engine
Runs the trained model over the real per-district weather series
(past 60 days + 16-day forecast) and serves every derived view the
dashboards need: today's risk, 7-day change, weekly history, forecast.

The weather fetch is cached for CACHE_TTL_SECONDS so dashboards stay fast and
the free weather API is not hammered. If a refresh fails but an older snapshot
exists, the older (still real) snapshot is served.
"""

import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from loguru import logger

from ml.feature_extractor import FeatureExtractor, WeatherUnavailable, kigali_today
from ml.predictor import RiskPredictor

CACHE_TTL_SECONDS = 30 * 60


class RiskEngine:
    def __init__(self, predictor: RiskPredictor):
        self.predictor = predictor
        self.extractor = FeatureExtractor()
        self._series: Dict[str, List[dict]] = {}
        self._fetched_at: Optional[float] = None
        self._lock = asyncio.Lock()

    # ── Snapshot loading ───────────────────────────────────────────────────────

    @property
    def fetched_at(self) -> Optional[datetime]:
        return datetime.utcfromtimestamp(self._fetched_at) if self._fetched_at else None

    async def snapshot(self, force: bool = False) -> Dict[str, List[dict]]:
        """{district: [day dict with features + risk_score/level/confidence]}"""
        fresh = self._fetched_at and (time.time() - self._fetched_at) < CACHE_TTL_SECONDS
        if self._series and fresh and not force:
            return self._series

        async with self._lock:
            fresh = self._fetched_at and (time.time() - self._fetched_at) < CACHE_TTL_SECONDS
            if self._series and fresh and not force:
                return self._series
            try:
                raw = await self.extractor.fetch_series()
            except WeatherUnavailable:
                if self._series:
                    logger.warning("Weather refresh failed — serving the last real snapshot")
                    return self._series
                raise

            series: Dict[str, List[dict]] = {}
            for district, days in raw.items():
                preds = self.predictor.predict_batch(days)
                series[district] = [
                    {**day, "risk_score": p["risk_score"], "risk_level": p["risk_level"],
                     "confidence": p["confidence"]}
                    for day, p in zip(days, preds)
                ]
            self._series = series
            self._fetched_at = time.time()
            return self._series

    # ── Views ──────────────────────────────────────────────────────────────────

    @staticmethod
    def _day(days: List[dict], offset: int = 0) -> Optional[dict]:
        target = (kigali_today() + timedelta(days=offset)).isoformat()
        return next((d for d in days if d["date"] == target), None)

    async def today(self) -> Dict[str, dict]:
        snap = await self.snapshot()
        return {name: self._day(days) for name, days in snap.items() if self._day(days)}

    async def district_today(self, district: str) -> Optional[dict]:
        snap = await self.snapshot()
        return self._day(snap.get(district, []))

    async def risk_change_pts(self, district: str, days: int = 7) -> float:
        """Change of the 0-100 risk score vs. `days` ago, in points (avoids meaningless % on tiny baselines)."""
        snap = await self.snapshot()
        series = snap.get(district, [])
        now, then = self._day(series), self._day(series, -days)
        if not now or not then:
            return 0.0
        return round((now["risk_score"] - then["risk_score"]) * 100, 1)

    async def trend_label(self, district: str) -> str:
        """Increasing / Stable / Decreasing from the real 7-day change (more than 3 points)."""
        change = await self.risk_change_pts(district)
        if change > 3:
            return "Increasing"
        if change < -3:
            return "Decreasing"
        return "Stable"

    async def series(self, district: str, past: int = 14, ahead: int = 16) -> List[dict]:
        """Daily real series around today (past days + forecast days)."""
        snap = await self.snapshot()
        today = kigali_today()
        lo, hi = today - timedelta(days=past), today + timedelta(days=ahead)
        return [d for d in snap.get(district, [])
                if lo.isoformat() <= d["date"] <= hi.isoformat()]

    async def national_weekly(self, weeks: int = 6, forecast_weeks: int = 2) -> List[dict]:
        """
        Weekly national average risk (0-100).
        Past weeks come from the model run over observed weather ('historical'),
        upcoming weeks from the model run over the weather forecast ('predicted').
        The current week appears in both so the two lines connect.
        """
        snap = await self.snapshot()
        today = kigali_today()

        def week_avg(start_offset: int, end_offset: int) -> Optional[float]:
            scores = []
            for days in snap.values():
                for off in range(start_offset, end_offset + 1):
                    d = self._day(days, off)
                    if d:
                        scores.append(d["risk_score"])
            return round(sum(scores) / len(scores) * 100, 1) if scores else None

        out = []
        for w in range(weeks - 1, -1, -1):          # w weeks ago
            start, end = -(w * 7) - 6, -(w * 7)
            label_day = today + timedelta(days=end)
            avg = week_avg(start, end)
            out.append({
                "week": label_day.strftime("%b %d"),
                "historical": avg,
                "predicted": avg if w == 0 else None,
            })
        for w in range(1, forecast_weeks + 1):
            start, end = (w - 1) * 7 + 1, w * 7
            label_day = today + timedelta(days=end)
            out.append({
                "week": label_day.strftime("%b %d"),
                "historical": None,
                "predicted": week_avg(start, end),
            })
        return out
