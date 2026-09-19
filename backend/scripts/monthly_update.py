"""
scripts/monthly_update.py
Run once a month to refresh historical data and retrain on the full dataset.
Usage: python -m scripts.monthly_update
"""
import subprocess
import sys
from datetime import datetime

def run(cmd):
    print(f"\n{'='*50}")
    print(f"Running: {cmd}")
    print('='*50)
    result = subprocess.run(
        [sys.executable, "-m", cmd],
        capture_output=False
    )
    if result.returncode != 0:
        print(f"❌ Failed: {cmd}")
        sys.exit(1)
    print(f"✅ Done: {cmd}")

if __name__ == "__main__":
    print(f"\n🦟 Zero Bite Monthly Update — {datetime.now().strftime('%B %Y')}")
    print("This will fetch fresh data and retrain the model.")
    print("Takes about 10-15 minutes total.\n")

    # Step 1 — Re-fetch all weather data (gets newest month added)
    run("scripts.fetch_historical_weather")

    # Step 2 — Recalculate soil moisture
    run("scripts.derive_soil_moisture")

    # Step 3 — Rebuild final dataset
    run("scripts.build_training_dataset")

    # Step 4 — Retrain on full updated dataset
    run("scripts.train_local")

    print(f"\n{'='*50}")
    print(f"✅ Monthly update complete!")
    print(f"   Restart uvicorn to load the new model:")
    print(f"   uvicorn api.main:app --reload --port 8000")
    print(f"{'='*50}\n")