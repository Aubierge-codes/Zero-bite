"""
Database Seed Script
Populates demo data for development and testing.
Run: python scripts/seed_db.py
"""

import asyncio
import uuid
from datetime import datetime, timedelta
import random
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed():
    import sys
    sys.path.insert(0, ".")

    from database.session import AsyncSessionLocal, init_db
    from database.models import (
        User, RiskZone, FieldTeam, Alert,
        GridCell, ActivityLog, ModelVersion
    )

    await init_db()

    async with AsyncSessionLocal() as db:

        # --- USERS ---
        users = [
            User(id=str(uuid.uuid4()), full_name="Admin User", email="admin@zerobite.rw",
                 hashed_password=pwd_context.hash("admin123"), role="admin", phone="+250788000001"),
            User(id=str(uuid.uuid4()), full_name="Dr. Amina Uwimana", email="amina@rbc.gov.rw",
                 hashed_password=pwd_context.hash("health123"), role="health_official", phone="+250788000002"),
            User(id=str(uuid.uuid4()), full_name="Jean Claude Nshimiyimana", email="jean@zerobite.rw",
                 hashed_password=pwd_context.hash("field123"), role="field_worker", phone="+250788000003"),
        ]
        for u in users:
            db.add(u)
        await db.flush()

        # --- RISK ZONES (Kigali area) ---
        zone_data = [
            ("Nyabugogo Valley", "Kigali", "Nyarugenge", -1.9377, 30.0593, "HIGH", 0.87),
            ("Gikondo Lowland", "Kigali", "Kicukiro", -1.9820, 30.0850, "HIGH", 0.82),
            ("Kacyiru Wetland", "Kigali", "Gasabo", -1.9290, 30.0890, "HIGH", 0.79),
            ("Kimironko Drain", "Kigali", "Gasabo", -1.9150, 30.1120, "MODERATE", 0.58),
            ("Kanombe East", "Kigali", "Kicukiro", -1.9680, 30.1350, "MODERATE", 0.52),
            ("Gisozi Ridge", "Kigali", "Gasabo", -1.8980, 30.0750, "MODERATE", 0.47),
            ("Remera North", "Kigali", "Gasabo", -1.9500, 30.1050, "LOW", 0.22),
            ("Kibagabaga", "Kigali", "Gasabo", -1.9100, 30.1200, "LOW", 0.18),
        ]

        # --- RISK ZONES (national spread) ---
        # region == district here (aggregate_to_district groups by .region), and
        # the coordinates/scores match what the frontend dashboards already show
        # as hardcoded demo data, so the numbers stay consistent once the
        # frontend switches from mocks to these live endpoints.
        national_zone_data = [
            ("Ndego Marsh",        "Nyagatare",  "Nyagatare",  -1.2925, 30.3253, "CRITICAL", 0.91),
            ("Akagera Riverbank",  "Kayonza",    "Kayonza",    -1.8825, 30.6438, "CRITICAL", 0.88),
            ("Nyabarongo Lowland", "Bugesera",   "Bugesera",   -2.2367, 30.2483, "CRITICAL", 0.82),
            ("Volcanoes Foothill", "Musanze",    "Musanze",    -1.4998, 29.6344, "HIGH",     0.78),
            ("Mulindi Wetland",    "Gicumbi",    "Gicumbi",    -1.6939, 30.0692, "HIGH",     0.75),
            ("Kivu Shoreline",     "Nyamasheke", "Nyamasheke", -2.3583, 29.1167, "HIGH",     0.68),
            ("Gisenyi Basin",      "Rubavu",     "Rubavu",     -1.6939, 29.2569, "MODERATE", 0.64),
            ("Huye Dry Plateau",   "Huye",       "Huye",       -2.5967, 29.7392, "LOW",      0.22),
        ]
        zone_data += national_zone_data

        zones = []
        for name, region, district, lat, lon, level, score in zone_data:
            z = RiskZone(
                id=str(uuid.uuid4()),
                site_name=name, region=region, district=district,
                latitude=lat, longitude=lon, risk_level=level, risk_score=score,
                rainfall_mm=random.uniform(30, 70),
                temperature_c=random.uniform(24, 32),
                ndvi=random.uniform(0.4, 0.8),
                humidity_pct=random.uniform(70, 90),
                soil_moisture=random.uniform(0.3, 0.7),
                river_buffer_m=random.uniform(50, 400),
                depression_index=random.uniform(0.4, 0.9),
            )
            db.add(z)
            zones.append(z)
        await db.flush()

        # --- FIELD TEAMS ---
        teams = [
            FieldTeam(id=str(uuid.uuid4()), name="Alpha Team", leader_name="Emmanuel Habimana",
                      leader_phone="+250788100001", district="Nyarugenge", team_size=5,
                      status="deployed", specialization="larviciding"),
            FieldTeam(id=str(uuid.uuid4()), name="Beta Team", leader_name="Claudine Uwase",
                      leader_phone="+250788100002", district="Gasabo", team_size=4,
                      status="available", specialization="survey"),
            FieldTeam(id=str(uuid.uuid4()), name="Gamma Team", leader_name="Patrick Nzeyimana",
                      leader_phone="+250788100003", district="Kicukiro", team_size=6,
                      status="available", specialization="larviciding"),
        ]
        for t in teams:
            db.add(t)

        # --- ALERTS ---
        for zone in zones[:3]:  # High-risk zones get alerts
            db.add(Alert(
                id=str(uuid.uuid4()),
                zone_id=zone.id,
                risk_level=zone.risk_level,
                region=zone.region,
                site_name=zone.site_name,
                trigger_reason=f"Rainfall surge detected. Risk score: {zone.risk_score:.2f}",
                status="active",
            ))

        # --- MODEL VERSION ---
        db.add(ModelVersion(
            id=str(uuid.uuid4()),
            version="v2.4",
            accuracy=0.891,
            precision_score=0.874,
            recall=0.883,
            f1_score=0.878,
            auc_roc=0.934,
            training_samples=3847,
            feature_importance={
                "rainfall_mm": 0.35, "temperature_c": 0.20, "ndvi": 0.15,
                "humidity_pct": 0.10, "soil_moisture": 0.08,
                "river_buffer_m": 0.07, "depression_index": 0.05,
            },
            is_production=True,
            model_path="/models/risk_classifier.joblib",
            trained_at=datetime.utcnow() - timedelta(days=3),
        ))

        # --- ACTIVITY LOG ---
        events = [
            ("prediction_run", "Daily prediction: 14 HIGH, 38 MODERATE zones identified"),
            ("model_retrain", "Weekly retraining complete — 3847 samples, accuracy 89.1%"),
            ("satellite_ingestion", "Sentinel-2 tile processed — 580km² coverage"),
            ("alert_broadcast", "3 HIGH-risk alerts dispatched to 8 health officials"),
        ]
        for i, (etype, desc) in enumerate(events):
            db.add(ActivityLog(
                id=str(uuid.uuid4()),
                event_type=etype,
                description=desc,
                created_at=datetime.utcnow() - timedelta(hours=i * 3),
            ))

        await db.commit()
        print("✅ Database seeded successfully")
        print("   Admin login: admin@zerobite.rw / admin123")


if __name__ == "__main__":
    asyncio.run(seed())
