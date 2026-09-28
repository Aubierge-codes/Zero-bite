"""
Test setup.

- Uses a throwaway SQLite database and disables the background scheduler.
- Replaces the Open-Meteo call with deterministic synthetic weather so tests
  never touch the network (the production code path is otherwise unchanged).
- Runs every coroutine on ONE event loop (the async DB pool and locks are
  bound to the loop that first used them).
"""

import asyncio
import os
import sys
import tempfile
from datetime import timedelta
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)   # model + training data paths are relative to backend/

_db_file = Path(tempfile.gettempdir()) / f"zerobite_test_{os.getpid()}.db"
os.environ.update({
    "APP_ENV": "test",
    "DEBUG": "true",
    "SECRET_KEY": "test-secret-key-that-is-long-enough-1234567890",
    "DATABASE_URL": f"sqlite+aiosqlite:///{_db_file.as_posix()}",
    "RUN_SCHEDULER": "false",
    "AFRICASTALKING_API_KEY": "",
    "AT_API_KEY": "",
    "TRUST_PROXY_HEADERS": "false",
})

LOOP = asyncio.new_event_loop()


def run(coro):
    return LOOP.run_until_complete(coro)


def synthetic_weather(districts):
    """Open-Meteo-shaped daily series (60 days back, 16 ahead) for every district."""
    from ml.feature_extractor import FORECAST_DAYS, PAST_DAYS, kigali_today

    today = kigali_today()
    days = [today + timedelta(days=i) for i in range(-PAST_DAYS, FORECAST_DAYS)]
    out = {}
    for idx, (name, *_rest) in enumerate(districts):
        out[name] = {
            "time": [d.isoformat() for d in days],
            "precipitation_sum": [float((i * 7 + idx * 3) % 25) for i in range(len(days))],
            "temperature_2m_mean": [18.0 + (idx % 8) + (i % 5) * 0.5 for i in range(len(days))],
            "relative_humidity_2m_mean": [60.0 + (idx * 5 + i) % 35 for i in range(len(days))],
            "sunshine_duration": [3600.0 * (4 + (i + idx) % 6) for i in range(len(days))],
        }
    return out


@pytest.fixture(scope="session", autouse=True)
def _no_network():
    import ml.feature_extractor as fe
    original = fe._fetch_weather_sync
    fe._fetch_weather_sync = synthetic_weather
    yield
    fe._fetch_weather_sync = original


@pytest.fixture()
def fresh_db():
    """Empty database + cleared rate limits for each API test."""
    from api import rate_limit
    from database.models import Base
    from database.session import engine, init_db

    async def reset():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await init_db()

    run(reset())
    rate_limit.reset()
    yield


@pytest.fixture()
def api(fresh_db):
    """Minimal synchronous wrapper around an in-process httpx client."""
    import httpx
    from api.main import app

    class Api:
        def request(self, method, path, token=None, **kw):
            headers = kw.pop("headers", {})
            if token:
                headers["Authorization"] = f"Bearer {token}"

            async def go():
                transport = httpx.ASGITransport(app=app)
                async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
                    return await c.request(method, path, headers=headers, **kw)

            return run(go())

        def get(self, path, **kw):
            return self.request("GET", path, **kw)

        def post(self, path, **kw):
            return self.request("POST", path, **kw)

        def patch(self, path, **kw):
            return self.request("PATCH", path, **kw)

        def create_user(self, email, password="password123", role="admin", district=None, phone=None):
            """Insert a user directly (bypasses the register permission rules)."""
            from api.routers.auth import pwd_context
            from database.models import User
            from database.session import AsyncSessionLocal

            async def go():
                async with AsyncSessionLocal() as db:
                    db.add(User(full_name=email.split("@")[0], email=email, role=role, district=district,
                                phone=phone, hashed_password=pwd_context.hash(password), is_active=True))
                    await db.commit()

            run(go())

        def login(self, email, password="password123"):
            r = self.post("/api/v1/auth/login", data={"username": email, "password": password})
            assert r.status_code == 200, r.text
            return r.json()["access_token"]

    return Api()


def pytest_sessionfinish(session, exitstatus):
    try:
        from database.session import engine
        run(engine.dispose())
    except Exception:
        pass
    try:
        _db_file.unlink(missing_ok=True)
    except OSError:
        pass
