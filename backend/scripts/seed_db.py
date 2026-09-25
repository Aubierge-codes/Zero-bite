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
        User
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
                 hashed_password=pwd_context.hash("field123"), role="field_worker", phone="+250788000003", district="Gasabo"),
        ]
        for u in users:
            db.add(u)
        await db.flush()

        # Risk zones, alerts, activity and model metrics are NOT seeded: they are
        # generated from live weather by the prediction engine (ml/refresh.py) on
        # API startup, so every number the dashboards show is real.

        await db.commit()
        print("✅ Database seeded successfully")
        print("   Admin login: admin@zerobite.rw / admin123")


if __name__ == "__main__":
    asyncio.run(seed())
