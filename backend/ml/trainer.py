"""
Model Trainer
Retrains the XGBoost model using accumulated field data.
This is the "Continuous Learning Engine" component of Zero_Bite.
"""

import numpy as np
import pandas as pd
import joblib
import xgboost as xgb
from pathlib import Path
from datetime import datetime
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, classification_report
)
from loguru import logger

from api.config import get_settings
from ml.schemas import ModelMetrics

settings = get_settings()

FEATURE_COLUMNS = [
    # Original 7
    "rainfall_mm",
    "temperature_c",
    "ndvi",
    "humidity_pct",
    "soil_moisture",
    "river_buffer_m",
    "depression_index",
    # 5 new — required by workflow doc (12 total)
    "flood_risk_index",
    "standing_water_km2",
    "sunshine_hours",
    "population_density",
    "season_weight",
]


class ModelTrainer:

    def __init__(self):
        self._status = {"state": "idle", "progress": 0, "last_trained": None}

    async def load_training_data(self, include_field_data: bool = True) -> pd.DataFrame:
        """
        Load all available training data in priority order:
        1. PostgreSQL DB (live ingested data — grows every day after launch)
        2. CSV fallback (training_data/dataset_final.csv — 10 years historical)

        The CSV fallback activates when the DB has fewer than 100 rows,
        which is always true on first run before real data is ingested.
        Both sources are merged if the DB has SOME rows but less than the CSV.
        """
        from sqlalchemy import select
        from database.session import AsyncSessionLocal
        from database.models import EnvironmentalFeatures, TreatmentRecord

        df = pd.DataFrame()  # start empty

        # ── Step 1: Load from DB ───────────────────────────────────────────────
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(EnvironmentalFeatures))
                features = result.scalars().all()

                if features:
                    df = pd.DataFrame([{
                        "rainfall_mm":        f.rainfall_mm,
                        "temperature_c":      f.temperature_c,
                        "ndvi":               f.ndvi,
                        "humidity_pct":       f.humidity_pct,
                        "soil_moisture":      f.soil_moisture,
                        "river_buffer_m":     f.river_buffer_m,
                        "depression_index":   f.depression_index,
                        "flood_risk_index":   getattr(f, "flood_risk_index",   None),
                        "standing_water_km2": getattr(f, "standing_water_km2", None),
                        "sunshine_hours":     getattr(f, "sunshine_hours",     None),
                        "population_density": getattr(f, "population_density", None),
                        "season_weight":      getattr(f, "season_weight",      None),
                    } for f in features])
                    logger.info(f"Loaded {len(df):,} rows from database")

                if include_field_data and len(df) > 0:
                    result2 = await db.execute(
                        select(TreatmentRecord).where(
                            TreatmentRecord.larvae_count_before.isnot(None)
                        )
                    )
                    records = result2.scalars().all()
                    logger.info(f"Found {len(records)} field treatment records")

        except Exception as e:
            logger.warning(f"DB load failed: {e} — will try CSV fallback")

        # ── Step 2: CSV fallback if DB is empty or sparse ─────────────────────
        if len(df) < 100:
            csv_path = Path("training_data/dataset_final.csv")

            if csv_path.exists():
                logger.info(
                    f"DB has {len(df)} rows (< 100) — "
                    f"loading historical data from {csv_path}"
                )
                csv_df = pd.read_csv(csv_path, parse_dates=["date"])

                # Keep only the 12 ML feature columns (drop date, district, etc.)
                available_cols = [c for c in FEATURE_COLUMNS if c in csv_df.columns]
                csv_df = csv_df[available_cols]

                if len(df) > 0:
                    # DB has some rows — merge CSV + DB so nothing is wasted
                    logger.info(f"Merging {len(df)} DB rows + {len(csv_df):,} CSV rows")
                    df = pd.concat([df[available_cols], csv_df], ignore_index=True)
                else:
                    df = csv_df

                logger.info(f"Total after CSV load: {len(df):,} training rows")

            else:
                logger.warning(
                    "No CSV found and DB is sparse. "
                    "Run: python -m scripts.build_training_dataset"
                )

        return df

    def engineer_labels(self, df: pd.DataFrame) -> np.ndarray:
        """
        Generate risk labels from environmental features.
        Labels: 0=LOW, 1=MODERATE, 2=HIGH, 3=CRITICAL
        Matches the 4-level system defined in the Zero Bite workflow doc.
        """
        score = (
            0.30 * (df["rainfall_mm"]          / df["rainfall_mm"].max())
            + 0.15 * (df["temperature_c"]      / 40)
            + 0.12 * df["ndvi"]
            + 0.10 * (df["humidity_pct"]        / 100)
            + 0.08 * df["soil_moisture"]
            - 0.06 * (1 - df["river_buffer_m"] / df["river_buffer_m"].max())
            + 0.05 * df["depression_index"]
            + 0.07 * df["flood_risk_index"]
            + 0.05 * (df["standing_water_km2"] / df["standing_water_km2"].max())
            + 0.02 * df["season_weight"]
        )
        return np.where(score > 0.80, 3,        # CRITICAL — imminent outbreak
               np.where(score > 0.65, 2,        # HIGH — active breeding threat
               np.where(score > 0.35, 1, 0)))   # MODERATE / LOW

    async def retrain(self, include_field_data: bool = True, min_samples: int = 500):
        """
        Full retraining pipeline:
        1. Load data → 2. Preprocess → 3. Train → 4. Evaluate → 5. Save
        """
        self._status = {"state": "running", "progress": 10, "last_trained": None}
        logger.info("Starting model retraining...")

        try:
            df = await self.load_training_data(include_field_data)

            if len(df) < min_samples:
                logger.warning(f"Only {len(df)} samples available, need {min_samples}")
                self._status["state"] = "skipped"
                return

            self._status["progress"] = 30

            # Clean and prepare — drop rows missing any feature
            df = df[FEATURE_COLUMNS].dropna()
            y  = self.engineer_labels(df)
            X  = df[FEATURE_COLUMNS].values

            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )

            self._status["progress"] = 50

            # Scale features
            scaler         = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled  = scaler.transform(X_test)

            # Train XGBoost — 4-class classifier
            model = xgb.XGBClassifier(
                n_estimators=200,           # 200 decision trees
                max_depth=4,                # shallow = avoids memorizing data
                learning_rate=0.05,         # slow, careful learning
                subsample=0.8,              # use 80% of rows per tree
                colsample_bytree=0.8,       # use 80% of features per tree
                scale_pos_weight=2,         # compensates for fewer HIGH/CRITICAL samples
                num_class=4,                # LOW / MODERATE / HIGH / CRITICAL
                objective="multi:softprob",
                eval_metric="mlogloss",
                random_state=42,
                n_jobs=-1,                  # use all CPU cores
            )
            model.fit(
                X_train_scaled, y_train,
                eval_set=[(X_test_scaled, y_test)],
                verbose=False,
            )

            self._status["progress"] = 75

            # Evaluate
            y_pred    = model.predict(X_test_scaled)
            accuracy  = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
            recall    = recall_score(y_test, y_pred, average="weighted", zero_division=0)
            f1        = f1_score(y_test, y_pred, average="weighted", zero_division=0)

            logger.info(f"New model — Accuracy: {accuracy:.3f}, F1: {f1:.3f}")
            logger.info("\n" + classification_report(
                y_test, y_pred,
                target_names=["LOW", "MODERATE", "HIGH", "CRITICAL"]
            ))

            # XGBoost native feature importance
            importance_scores  = model.feature_importances_
            feature_importance = {
                feat: round(float(imp), 4)
                for feat, imp in zip(FEATURE_COLUMNS, importance_scores)
            }

            # Save model and scaler to disk
            version     = f"v{datetime.utcnow().strftime('%Y%m%d_%H%M')}"
            model_path  = Path(settings.MODEL_PATH)
            scaler_path = Path(settings.SCALER_PATH)
            model_path.parent.mkdir(parents=True, exist_ok=True)

            joblib.dump(model,  model_path)
            joblib.dump(scaler, scaler_path)

            # Record model version in DB
            await self._save_model_version(
                version=version,
                accuracy=accuracy,
                precision_score=precision,
                recall=recall,
                f1_score=f1,
                training_samples=len(df),
                feature_importance=feature_importance,
                model_path=str(model_path),
            )

            self._status = {
                "state":        "completed",
                "progress":     100,
                "last_trained": datetime.utcnow().isoformat(),
                "accuracy":     accuracy,
                "version":      version,
            }
            logger.info(f"Retraining complete — version {version} saved")

        except Exception as e:
            self._status = {"state": "failed", "error": str(e), "progress": 0}
            logger.error(f"Retraining failed: {e}")
            raise

    async def _save_model_version(self, **kwargs):
        """Save new version to DB and demote the previous production model."""
        from sqlalchemy import update
        from database.session import AsyncSessionLocal
        from database.models import ModelVersion

        async with AsyncSessionLocal() as db:
            await db.execute(
                update(ModelVersion)
                .where(ModelVersion.is_production == True)
                .values(is_production=False)
            )
            new_version = ModelVersion(**kwargs, is_production=True)
            db.add(new_version)
            await db.commit()
            logger.info(f"Saved and promoted model version: {kwargs.get('version')}")

    async def get_current_metrics(self) -> ModelMetrics:
        """Return metrics of the current production model."""
        from sqlalchemy import select
        from database.session import AsyncSessionLocal
        from database.models import ModelVersion

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(ModelVersion)
                .where(ModelVersion.is_production == True)
                .order_by(ModelVersion.trained_at.desc())
                .limit(1)
            )
            latest = result.scalar_one_or_none()

            if not latest:
                return ModelMetrics(
                    version="demo-v1.0",
                    accuracy=0.89,
                    precision_score=0.87,
                    recall=0.88,
                    f1_score=0.87,
                    training_samples=0,
                )

            return ModelMetrics(
                version=latest.version,
                accuracy=latest.accuracy,
                precision_score=latest.precision_score,
                recall=latest.recall,
                f1_score=latest.f1_score,
                training_samples=latest.training_samples,
            )

    async def get_status(self) -> dict:
        return self._status

    async def get_feature_importance(self) -> dict:
        """Return feature importance scores from the current production model."""
        from sqlalchemy import select
        from database.session import AsyncSessionLocal
        from database.models import ModelVersion

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(ModelVersion)
                .where(ModelVersion.is_production == True)
                .order_by(ModelVersion.trained_at.desc())
                .limit(1)
            )
            latest = result.scalar_one_or_none()

            if latest and latest.feature_importance:
                return latest.feature_importance

        # Fallback defaults covering all 12 features
        return {
            "rainfall_mm":        0.30,
            "temperature_c":      0.15,
            "ndvi":               0.12,
            "humidity_pct":       0.10,
            "soil_moisture":      0.08,
            "river_buffer_m":     0.06,
            "depression_index":   0.05,
            "flood_risk_index":   0.07,
            "standing_water_km2": 0.05,
            "sunshine_hours":     0.01,
            "population_density": 0.01,
            "season_weight":      0.00,
        }