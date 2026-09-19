"""
scripts/train_local.py
Trains the model on real historical data from training_data/dataset_final.csv
Usage: python -m scripts.train_local
"""
import numpy as np
import pandas as pd
import joblib
import xgboost as xgb
from pathlib import Path
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score

FEATURE_COLUMNS = [
    "rainfall_mm",
    "temperature_c",
    "ndvi",
    "humidity_pct",
    "soil_moisture",
    "river_buffer_m",
    "depression_index",
    "flood_risk_index",
    "standing_water_km2",
    "sunshine_hours",
    "population_density",
    "season_weight",
]


def load_real_data() -> pd.DataFrame:
    csv_path = Path("training_data/dataset_final.csv")
    if not csv_path.exists():
        print("❌ training_data/dataset_final.csv not found.")
        print("   Run: python -m scripts.build_training_dataset first.")
        exit(1)

    print(f"Loading {csv_path}...")
    df = pd.read_csv(csv_path, parse_dates=["date"])
    print(f"Loaded {len(df):,} rows | Districts: {df['district'].nunique()} | "
          f"Date range: {df['date'].min().date()} → {df['date'].max().date()}")

    for col in FEATURE_COLUMNS:
        if col not in df.columns:
            print(f"  ⚠ Missing column '{col}' — filling with 0.0")
            df[col] = 0.0

    df = df[FEATURE_COLUMNS].dropna()
    print(f"After dropna: {len(df):,} rows")
    return df


def engineer_labels(df: pd.DataFrame) -> np.ndarray:
    """
    Percentile-based thresholds so all 4 classes always get real samples.
    Top 5% = CRITICAL, next 15% = HIGH, next 30% = MODERATE, bottom 50% = LOW
    """
    rain_max  = df["rainfall_mm"].max()        or 1
    river_max = df["river_buffer_m"].max()     or 1
    water_max = df["standing_water_km2"].max() or 1

    score = (
        0.30 * (df["rainfall_mm"]        / rain_max)
        + 0.15 * (df["temperature_c"]    / 40)
        + 0.12 * df["ndvi"]
        + 0.10 * (df["humidity_pct"]     / 100)
        + 0.08 * df["soil_moisture"]
        - 0.06 * (1 - df["river_buffer_m"] / river_max)
        + 0.05 * df["depression_index"]
        + 0.07 * df["flood_risk_index"]
        + 0.05 * (df["standing_water_km2"] / water_max)
        + 0.02 * df["season_weight"]
    )

    p95 = float(np.percentile(score, 95))
    p80 = float(np.percentile(score, 80))
    p50 = float(np.percentile(score, 50))

    print(f"  Thresholds — p50: {p50:.3f} | p80: {p80:.3f} | p95: {p95:.3f}")

    labels = np.where(score >= p95, 3,
             np.where(score >= p80, 2,
             np.where(score >= p50, 1, 0))).astype(int)

    names = {0: "LOW", 1: "MODERATE", 2: "HIGH", 3: "CRITICAL"}
    unique, counts = np.unique(labels, return_counts=True)
    for u, c in zip(unique, counts):
        print(f"  {names[u]:<10} {c:>7,}  ({c/len(labels)*100:.1f}%)")

    return labels


if __name__ == "__main__":
    print("🦟 Zero_Bite — Real Data Model Training")
    print("=" * 45)

    X = load_real_data()
    print("\nLabel distribution:")
    y = engineer_labels(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X.values, y, test_size=0.2, stratify=y, random_state=42
    )
    print(f"\nTrain: {len(X_train):,} | Test: {len(X_test):,}")

    scaler    = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    print("\nTraining XGBoost on real Rwanda data...")
    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        num_class=4,
        objective="multi:softprob",
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(
        X_train_s, y_train,
        eval_set=[(X_test_s, y_test)],
        verbose=False,
    )

    # Cast to plain int arrays — prevents the multilabel error
    y_test = np.array(y_test, dtype=int)
    y_pred = np.array(model.predict(X_test_s), dtype=int)

    print(f"\nAccuracy: {accuracy_score(y_test, y_pred)*100:.1f}%")

    present = sorted(np.unique(np.concatenate([y_test, y_pred])))
    names   = {0: "LOW", 1: "MODERATE", 2: "HIGH", 3: "CRITICAL"}
    print(classification_report(
        y_test, y_pred,
        labels=present,
        target_names=[names[i] for i in present],
        zero_division=0,
    ))

    print("Feature Importance:")
    for feat, imp in sorted(
        zip(FEATURE_COLUMNS, model.feature_importances_),
        key=lambda x: -x[1]
    ):
        bar = "█" * int(imp * 50)
        print(f"  {feat:<22} {bar} {imp:.3f}")

    # ✅ Tag model with version before saving
    model.version_tag = f"v{datetime.utcnow().strftime('%Y%m%d')}-rwanda-{len(X):,}rows"
    print(f"\n  Version tag: {model.version_tag}")

    out_dir = Path("models")
    out_dir.mkdir(exist_ok=True)

    joblib.dump(model,  out_dir / "zero_bite_model.pkl")
    joblib.dump(scaler, out_dir / "zero_bite_scaler.pkl")
    joblib.dump(model,  out_dir / "risk_classifier.joblib")
    joblib.dump(scaler, out_dir / "feature_scaler.joblib")

    print(f"\n✅ Saved to models/risk_classifier.joblib")
    print(f"✅ Saved to models/feature_scaler.joblib")
    print(f"\nRestart uvicorn to load the new model:")
    print(f"  uvicorn api.main:app --reload --port 8000")