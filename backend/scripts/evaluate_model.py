"""
scripts/evaluate_model.py
Measures the CURRENTLY DEPLOYED model on the held-out 20% test split of
training_data/dataset_final.csv (same split/seed as train_local.py) and writes
models/metrics.json, which the API serves at /api/v1/model/metrics.

Usage: python -m scripts.evaluate_model
"""
import json
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from sklearn.model_selection import train_test_split

from scripts.train_local import FEATURE_COLUMNS, engineer_labels, load_real_data


def write_metrics(model, scaler, X_test_s, y_test, n_train_rows: int, out_dir: Path = Path("models")):
    y_pred = np.array(model.predict(X_test_s), dtype=int)
    y_test = np.array(y_test, dtype=int)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_test, y_pred, average="weighted", zero_division=0
    )
    metrics = {
        "version": getattr(model, "version_tag", "unversioned"),
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "training_samples": int(n_train_rows),
        "test_samples": int(len(y_test)),
        "feature_importance": {
            name: round(float(imp), 4)
            for name, imp in zip(FEATURE_COLUMNS, model.feature_importances_)
        },
        "evaluated_at": datetime.utcnow().isoformat() + "Z",
        "note": "Evaluated against the rule-derived risk labels of dataset_final.csv (no clinical case data).",
    }
    out_dir.mkdir(exist_ok=True)
    (out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics


if __name__ == "__main__":
    X = load_real_data()
    y = engineer_labels(X)
    _, X_test, _, y_test = train_test_split(X.values, y, test_size=0.2, stratify=y, random_state=42)

    model = joblib.load("models/risk_classifier.joblib")
    scaler = joblib.load("models/feature_scaler.joblib")
    m = write_metrics(model, scaler, scaler.transform(X_test), y_test, n_train_rows=len(X))
    print(json.dumps(m, indent=2))
