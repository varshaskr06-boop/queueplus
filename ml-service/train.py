"""
QueuePulse AI - Random Forest Model Training Pipeline
Trains a RandomForestRegressor for predicting facility queue waiting time.
Evaluates the model against a deterministic baseline queuing formula.

IMPORTANT:
Never claim synthetic dataset accuracy represents real-world accuracy.
This model is trained on synthetic demonstration data simulating M/M/c queuing approximations.
"""

import os
from datetime import datetime
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score, root_mean_squared_error
from sklearn.model_selection import train_test_split

from dataset.generate_dataset import generate_synthetic_queue_data

FEATURE_COLUMNS = [
    "queue_length",
    "active_counters",
    "avg_service_time",
    "hour",
    "day_of_week",
    "historical_queue",
    "crowd_reports",
    "completion_rate",
]

TARGET_COLUMN = "wait_time_minutes"
MODEL_VERSION = "1.2.0-rf-demo"

def baseline_formula_predict(X: pd.DataFrame) -> np.ndarray:
    """
    Simple deterministic queuing baseline:
    Wait Time = (queue_length / max(1, active_counters)) * avg_service_time
    """
    queue_len = X["queue_length"].values
    counters = np.maximum(1, X["active_counters"].values)
    avg_srv = np.maximum(0.5, X["avg_service_time"].values)
    
    baseline_wait = (queue_len / counters) * avg_srv
    return np.maximum(0.0, baseline_wait)

def train_and_evaluate(n_samples: int = 5000, force_regenerate: bool = True):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_dir = os.path.join(base_dir, "dataset")
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(dataset_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)

    csv_path = os.path.join(dataset_dir, "queue_data.csv")
    if force_regenerate or not os.path.exists(csv_path):
        print(f"Generating synthetic demonstration dataset ({n_samples} samples)...")
        df = generate_synthetic_queue_data(n_samples=n_samples, random_state=42)
        df.to_csv(csv_path, index=False)
        print(f"Saved synthetic dataset to: {csv_path}")
    else:
        print(f"Loading existing dataset from: {csv_path}")
        df = pd.read_csv(csv_path)

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    # Train / Test split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )

    print(f"\nDataset Split:")
    print(f"  - Training samples: {len(X_train)}")
    print(f"  - Testing samples:  {len(X_test)}")
    print(f"  - Input features:   {len(FEATURE_COLUMNS)}")

    # 1. Baseline Model Evaluation
    y_pred_baseline = baseline_formula_predict(X_test)
    base_mae = mean_absolute_error(y_test, y_pred_baseline)
    base_rmse = root_mean_squared_error(y_test, y_pred_baseline)
    base_r2 = r2_score(y_test, y_pred_baseline)

    # 2. Random Forest Regressor Training
    print("\nTraining RandomForestRegressor...")
    rf_model = RandomForestRegressor(
        n_estimators=120,
        max_depth=14,
        min_samples_split=4,
        min_samples_leaf=2,
        max_features="sqrt",
        random_state=42,
        n_jobs=-1,
    )
    rf_model.fit(X_train, y_train)

    # 3. Random Forest Evaluation on Test Set
    y_pred_rf = rf_model.predict(X_test)
    # Clamp negative predictions to zero
    y_pred_rf = np.maximum(0.0, y_pred_rf)
    
    rf_mae = mean_absolute_error(y_test, y_pred_rf)
    rf_rmse = root_mean_squared_error(y_test, y_pred_rf)
    rf_r2 = r2_score(y_test, y_pred_rf)

    mae_reduction = ((base_mae - rf_mae) / base_mae) * 100.0
    rmse_reduction = ((base_rmse - rf_rmse) / base_rmse) * 100.0

    print("\n" + "=" * 60)
    print("MODEL EVALUATION & BASELINE COMPARISON")
    print("=" * 60)
    print(f"{'Metric':<18} | {'Simple Baseline Formula':<24} | {'Random Forest':<15}")
    print("-" * 60)
    print(f"{'MAE (minutes)':<18} | {base_mae:<24.3f} | {rf_mae:<15.3f}")
    print(f"{'RMSE (minutes)':<18} | {base_rmse:<24.3f} | {rf_rmse:<15.3f}")
    print(f"{'R-squared (R2)':<18} | {base_r2:<24.4f} | {rf_r2:<15.4f}")
    print("-" * 60)
    print(f"Random Forest MAE Error Reduction:  {mae_reduction:.1f}%")
    print(f"Random Forest RMSE Error Reduction: {rmse_reduction:.1f}%")
    print("=" * 60)

    # Feature Importances
    importances = dict(zip(FEATURE_COLUMNS, np.round(rf_model.feature_importances_, 4)))
    print("\nFeature Importances:")
    for feat, imp in sorted(importances.items(), key=lambda x: x[1], reverse=True):
        print(f"  - {feat:<20}: {imp:.4f}")

    # Build model bundle
    bundle = {
        "model": rf_model,
        "model_type": "RandomForestRegressor",
        "model_version": MODEL_VERSION,
        "feature_names": FEATURE_COLUMNS,
        "target_name": TARGET_COLUMN,
        "metrics": {
            "mae": round(float(rf_mae), 3),
            "rmse": round(float(rf_rmse), 3),
            "r2": round(float(rf_r2), 4),
        },
        "baseline_comparison": {
            "baseline_mae": round(float(base_mae), 3),
            "baseline_rmse": round(float(base_rmse), 3),
            "baseline_r2": round(float(base_r2), 4),
            "mae_reduction_percent": round(float(mae_reduction), 2),
            "rmse_reduction_percent": round(float(rmse_reduction), 2),
        },
        "feature_importances": importances,
        "synthetic_notice": (
            "NOTICE: Trained on synthetic demonstration data. "
            "Never claim synthetic accuracy represents real-world accuracy."
        ),
        "limitations": [
            "Trained on simulated queuing theory approximations (M/M/c approximation).",
            "Does not account for unrecorded staff breaks, medical triages, or irregular VIP lanes.",
            "Assumes stationary arrival rates within individual hour intervals.",
            "Accuracy in physical production requires field-collected sensor and ticket logs.",
        ],
        "created_at": datetime.now().isoformat(),
    }

    model_path = os.path.join(models_dir, "queue_wait_time_rf.joblib")
    joblib.dump(bundle, model_path)
    print(f"\nModel artifact serialized to: {model_path}")
    return bundle

if __name__ == "__main__":
    train_and_evaluate(n_samples=5000, force_regenerate=True)
