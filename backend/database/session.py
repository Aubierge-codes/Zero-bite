from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from database.models import Base
from api.config import get_settings

settings = get_settings()

db_url = settings.DATABASE_URL

# SQLite needs check_same_thread=False
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_async_engine(db_url, connect_args=connect_args, echo=False)
else:
    engine = create_async_engine(
        db_url,
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        echo=False,
    )

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # create_all never alters existing tables: add columns introduced after a
        # dev database was first created.
        if db_url.startswith("sqlite"):
            cols = {row[1] for row in (await conn.exec_driver_sql("PRAGMA table_info(users)")).fetchall()}
            if "district" not in cols:
                await conn.exec_driver_sql("ALTER TABLE users ADD COLUMN district VARCHAR(200)")


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
