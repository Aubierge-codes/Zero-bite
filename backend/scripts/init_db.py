"""
Initialize database — creates all tables.
Run: python scripts/init_db.py
"""
import asyncio
import sys
sys.path.insert(0, ".")


async def main():
    from database.session import init_db
    print("Initializing Zero_Bite database...")
    await init_db()
    print("✅ Tables created successfully")


if __name__ == "__main__":
    asyncio.run(main())
