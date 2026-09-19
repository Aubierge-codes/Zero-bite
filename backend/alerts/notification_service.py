"""
Notification Service
Multi-channel alert delivery: SMS (Africa's Talking), Email (SendGrid), Push (Firebase).
"""

from typing import List
from loguru import logger
from api.config import get_settings

settings = get_settings()


class NotificationService:

    async def send_sms(self, phone: str, message: str):
        """Send SMS via Africa's Talking gateway."""
        try:
            if not settings.africastalking_api_key:
                logger.warning("Africa's Talking API key not configured — SMS skipped")
                return {
                    "status": "skipped",
                    "reason": "AFRICASTALKING_API_KEY or AT_API_KEY is not configured",
                }

            import africastalking
            africastalking.initialize(
                settings.africastalking_username,
                settings.africastalking_api_key,
            )
            sms      = africastalking.SMS
            response = sms.send(message, [phone], settings.AT_SENDER_ID)
            logger.info(f"SMS sent to {phone}: {response}")
            return response

        except Exception as e:
            logger.error(f"SMS failed to {phone}: {e}")
            return {"status": "failed", "error": str(e)}

    async def send_email(self, to_email: str, subject: str, body: str):
        """Send alert email via SendGrid."""
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail

            message = Mail(
                from_email=settings.FROM_EMAIL,
                to_emails=to_email,
                subject=subject,
                html_content=body,
            )
            sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            sg.send(message)
            logger.info(f"Email sent to {to_email}")

        except Exception as e:
            logger.error(f"Email failed to {to_email}: {e}")

    async def send_push(self, device_token: str, title: str, body: str):
        """Send push notification via Firebase Cloud Messaging."""
        try:
            import firebase_admin
            from firebase_admin import messaging

            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                token=device_token,
            )
            messaging.send(message)
            logger.info(f"Push sent to {device_token[:10]}...")

        except Exception as e:
            logger.error(f"Push failed: {e}")

    async def broadcast_high_risk_alert(self, zones: list):
        """
        Broadcast HIGH/CRITICAL risk alerts to all health officials and field teams.
        Called automatically by the daily prediction task when risk threshold is crossed.
        """
        from sqlalchemy import select
        from database.session import AsyncSessionLocal
        from database.models import User

        async with AsyncSessionLocal() as db:
            # ✅ Fixed — was db.query() which is broken in async SQLAlchemy
            result = await db.execute(
                select(User).where(
                    User.role.in_(["admin", "health_official", "ministry", "district_officer"]),
                    User.is_active == True,
                )
            )
            officials = result.scalars().all()

        zone_names = ", ".join(z.site_name for z in zones[:3])
        message = (
            f"ZERO_BITE ALERT: {len(zones)} HIGH-RISK mosquito breeding zones detected. "
            f"Areas: {zone_names}. Immediate larviciding response required. "
            f"Log in to zerobite.rw for full heatmap."
        )

        for official in officials:
            if official.phone:
                await self.send_sms(official.phone, message)
            if official.email:
                await self.send_email(
                    official.email,
                    f"Zero_Bite: {len(zones)} High-Risk Zones Detected",
                    f"<h2>High-Risk Alert</h2><p>{message}</p>",
                )

        logger.info(f"Broadcast alert sent to {len(officials)} officials")


# ── Standalone helpers used by routers ────────────────────────────────────────

async def send_sms(phone: str, message: str) -> dict:
    """Standalone SMS helper — used by alerts.py and auth.py routers."""
    svc = NotificationService()
    return await svc.send_sms(phone, message)


async def send_email(to_email: str, subject: str, body: str) -> None:
    """Standalone email helper."""
    svc = NotificationService()
    return await svc.send_email(to_email, subject, body)