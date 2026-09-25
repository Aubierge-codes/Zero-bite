"""
scripts/purge_demo_data.py
Removes the fabricated rows an older scripts/seed_db.py inserted (fake zones, alerts,
teams, model version and activity log entries) so the app only shows real,
model-generated data. Real data is regenerated automatically on API startup.

Usage: python -m scripts.purge_demo_data
"""
import asyncio

from sqlalchemy import delete, select

SEEDED_ZONE_NAMES = {
    "Nyabugogo Valley", "Gikondo Lowland", "Kacyiru Wetland", "Kimironko Drain",
    "Kanombe East", "Gisozi Ridge", "Remera North", "Kibagabaga",
    "Ndego Marsh", "Akagera Riverbank", "Nyabarongo Lowland", "Volcanoes Foothill",
    "Mulindi Wetland", "Kivu Shoreline", "Gisenyi Basin", "Huye Dry Plateau",
}
SEEDED_TEAMS = {("Alpha Team", "+250788100001"), ("Beta Team", "+250788100002"), ("Gamma Team", "+250788100003")}
SEEDED_LOGS = {
    "Daily prediction: 14 HIGH, 38 MODERATE zones identified",
    "Weekly retraining complete — 3847 samples, accuracy 89.1%",
    "Sentinel-2 tile processed — 580km² coverage",
    "3 HIGH-risk alerts dispatched to 8 health officials",
}


async def main():
    from database.session import AsyncSessionLocal, init_db
    from database.models import RiskZone, Alert, FieldTeam, ModelVersion, ActivityLog, ZoneHistory, Prediction

    await init_db()
    async with AsyncSessionLocal() as db:
        # Fabricated zones: the old seed's named zones, plus the randomly generated grid
        # cells (KGL-xxxx / Zone-n / Site-n). Real zones are named "<District> District".
        zone_ids = [z.id for z in (await db.execute(select(RiskZone))).scalars().all()
                    if z.site_name in SEEDED_ZONE_NAMES or not (z.site_name or "").endswith(" District")]
        if zone_ids:
            await db.execute(delete(Alert).where(Alert.zone_id.in_(zone_ids)))
            await db.execute(delete(ZoneHistory).where(ZoneHistory.zone_id.in_(zone_ids)))
            await db.execute(delete(RiskZone).where(RiskZone.id.in_(zone_ids)))

        removed_teams = 0
        for team in (await db.execute(select(FieldTeam))).scalars().all():
            if (team.name, team.leader_phone) in SEEDED_TEAMS:
                await db.delete(team)
                removed_teams += 1

        # The old prediction runner hardcoded confidence_score=0.89 for every run.
        old_preds = await db.execute(delete(Prediction).where(Prediction.confidence_score == 0.89))
        mv = await db.execute(delete(ModelVersion).where(
            ModelVersion.version == "v2.4", ModelVersion.training_samples == 3847))
        logs = await db.execute(delete(ActivityLog).where(ActivityLog.description.in_(SEEDED_LOGS)))
        await db.commit()

    print(f"Removed {len(zone_ids)} seeded zones (+their alerts/history), {removed_teams} seeded teams, "
          f"{mv.rowcount} seeded model version(s), {logs.rowcount} seeded log entries, "
          f"{old_preds.rowcount} fabricated prediction run(s).")


if __name__ == "__main__":
    asyncio.run(main())
