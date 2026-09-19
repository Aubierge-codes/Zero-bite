"""
Alert Engine
Processes prediction results and generates prioritized alerts.
Dispatches SMS, email, and push notifications to relevant stakeholders.
"""

from datetime import datetime
from typing import List
from loguru import logger

from alerts.notification_service import NotificationService
from ml.schemas import RiskZoneResult, RiskLevel


class AlertEngine:

    def __init__(self):
        self.notifier = NotificationService()

    async def process_prediction_results(self, prediction_id: str, high_risk_zones: List[RiskZoneResult]):
        """
        Called after each prediction run.
        Creates alert records and dispatches notifications.
        """
        from database.session import AsyncSessionLocal
        from database.models import Alert, ActivityLog

        async with AsyncSessionLocal() as db:
            for zone in high_risk_zones:
                alert = Alert(
                    zone_id=zone.grid_cell_id,
                    risk_level=zone.risk_level.value,
                    region=zone.region,
                    site_name=zone.site_name,
                    trigger_reason=(
                        f"Rainfall: {zone.rainfall_mm:.1f}mm, "
                        f"Temp: {zone.temperature_c:.1f}°C, "
                        f"NDVI: {zone.ndvi:.2f}, "
                        f"Risk score: {zone.risk_score:.3f}"
                    ),
                    status="active",
                )
                db.add(alert)

            log = ActivityLog(
                event_type="prediction_alerts",
                description=f"{len(high_risk_zones)} high-risk alerts generated from prediction {prediction_id}",
                event_metadata={"prediction_id": prediction_id, "count": len(high_risk_zones)},
            )
            db.add(log)
            await db.commit()

        # Dispatch notifications
        if high_risk_zones:
            await self.notifier.broadcast_high_risk_alert(high_risk_zones)

        logger.info(f"Generated {len(high_risk_zones)} alerts for prediction {prediction_id}")
