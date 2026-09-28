from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from database.models import Base
from api.config import get_settings

settings = get_settings()


def _async_url(url: str) -> str:
    """Accept plain postgres:// URLs (as given by most hosts) and use the asyncpg driver."""
    if url.startswith("postgres://"):
        return "postgresql+asyncpg://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        return "postgresql+asyncpg://" + url[len("postgresql://"):]
    return url


db_url = _async_url(settings.DATABASE_URL)

if db_url.startswith("sqlite"):
    # SQLite needs check_same_thread=False
    engine = create_async_engine(db_url, connect_args={"check_same_thread": False}, echo=False)
else:
    engine = create_async_engine(
        db_url,
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        pool_pre_ping=True,
        echo=False,
    )

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Columns added after the first release. create_all() never alters existing
# tables, so they are added here for databases created by an older version.
_ADDED_COLUMNS = [
    ("users", "district", "VARCHAR(200)"),
    ("treatment_records", "district", "VARCHAR(200)"),
]


def _missing_columns(sync_conn):
    insp = inspect(sync_conn)
    tables = set(insp.get_table_names())
    missing = []
    for table, column, ddl in _ADDED_COLUMNS:
        if table in tables and column not in {c["name"] for c in insp.get_columns(table)}:
            missing.append((table, column, ddl))
    return missing


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        for table, column, ddl in await conn.run_sync(_missing_columns):
            await conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}")


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
