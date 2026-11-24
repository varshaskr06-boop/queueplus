"""
QueuePulse AI - Prediction Engine
Implements wait-time prediction using the trained RandomForestRegressor,
with input validation, negative-prediction clamping, calibrated variance confidence heuristic,
and transparent mathematical baseline fallback when the model artifact is unavailable.

IMPORTANT:
Never claim synthetic dataset accuracy represents real-world accuracy.
Confidence level is an ensemble variance heuristic reflecting tree agreement, not a frequentist probability.
"""

import os
from datetime import datetime
from typing import Any, Dict, Optional, Tuple
import joblib
import numpy as np
import pandas as pd

# Model artifact configuration
DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "models",
    "queue_wait_time_rf.joblib",
)

MODEL_BUNDLE: Optional[Dict[str, Any]] = None

FEATURE_NAMES = [
    "queue_length",
    "active_counters",
    "avg_service_time",
    "hour",
    "day_of_week",
    "historical_queue",
    "crowd_reports",
    "completion_rate",
]

def load_model(model_path: str = DEFAULT_MODEL_PATH) -> Optional[Dict[str, Any]]:
    """
    Safely load serialized model artifact with fallback capability.
    Caches only the default model path.
    """
    global MODEL_BUNDLE
    if model_path == DEFAULT_MODEL_PATH and MODEL_BUNDLE is not None:
        return MODEL_BUNDLE

    if os.path.exists(model_path):
        try:
            bundle = joblib.load(model_path)
            if model_path == DEFAULT_MODEL_PATH:
                MODEL_BUNDLE = bundle
            return bundle
        except Exception as err:
            print(f"[QueuePredictor] Warning: Failed to load model bundle: {err}. Falling back to baseline.")
            return None
    return None

def fallback_baseline_prediction(
    queue_length: float,
    active_counters: int,
    avg_service_time: float,
    completion_rate: Optional[float] = None,
) -> float:
    """
    Deterministic mathematical baseline formula:
    Wait Time = (queue_length / max(1, active_counters)) * avg_service_time
    Guaranteed non-negative, transparent fallback when ML model is offline.
    """
    if queue_length <= 0:
        return 0.0

    counters = max(1, int(active_counters))
    avg_service = max(0.5, float(avg_service_time))

    # Base wait calculation
    wait = (float(queue_length) / counters) * avg_service
    return max(0.0, round(float(wait), 2))

def calculate_crowd_level(predicted_minutes: float) -> str:
    """
    Map estimated minutes to congestion category:
    - LOW:      < 10 minutes
    - MODERATE: 10 - 24.9 minutes
    - HIGH:     25 - 44.9 minutes
    - CRITICAL: >= 45 minutes
    """
    if predicted_minutes < 10.0:
        return "LOW"
    elif predicted_minutes < 25.0:
        return "MODERATE"
    elif predicted_minutes < 45.0:
        return "HIGH"
    else:
        return "CRITICAL"

def compute_confidence_heuristic(
    model: Any,
    input_vector: list,
    pred_minutes: float,
) -> Tuple[float, float, float]:
    """
    Calculate confidence as an appropriately calibrated ensemble tree-variance heuristic.
    Higher inter-tree agreement yields higher confidence.
    Returns: (confidence_level, interval_lower, interval_upper)
    """
    if pred_minutes == 0.0:
        return 0.99, 0.0, 0.0

    try:
        # Evaluate spread across individual decision trees in the forest
        vec_values = input_vector.values if hasattr(input_vector, "values") else input_vector
        tree_predictions = [float(tree.predict(vec_values)[0]) for tree in model.estimators_]
        tree_std = float(np.std(tree_predictions))

        # Relative dispersion heuristic
        rel_std = tree_std / (pred_minutes + 2.0)
        # Calibrate between 0.55 and 0.98
        confidence = max(0.55, min(0.98, round(1.0 - (0.45 * rel_std), 2)))

        # 90% Empirical prediction bounds based on 1.645 * std
        lower_bound = max(0.0, round(pred_minutes - 1.645 * tree_std, 2))
        upper_bound = round(pred_minutes + 1.645 * tree_std, 2)
        return confidence, lower_bound, upper_bound
    except Exception:
        # Graceful fallback heuristic
        return 0.85, max(0.0, round(pred_minutes * 0.8, 2)), round(pred_minutes * 1.25, 2)

def predict_wait_time(
    queue_length: int,
    active_counters: int,
    avg_service_time: float,
    hour: Optional[int] = None,
    day_of_week: Optional[int] = None,
    historical_queue: Optional[float] = None,
    crowd_reports: Optional[float] = None,
    completion_rate: Optional[float] = None,
    model_path: str = DEFAULT_MODEL_PATH,
) -> Dict[str, Any]:
    """
    Main prediction pipeline:
    1. Validates and cleans all input features (handles missing/out-of-bounds inputs).
    2. Prevents negative waiting time predictions.
    3. Uses RandomForestRegressor when available.
    4. Falls back to transparent deterministic queuing baseline if model is unavailable.
    5. Returns calibrated tree-variance confidence and crowd classification.
    """
    now = datetime.now()

    # Input sanitization and bounds enforcement
    safe_queue_length = max(0, int(queue_length if queue_length is not None else 0))
    safe_active_counters = max(1, int(active_counters if active_counters is not None else 1))
    safe_avg_service_time = max(0.5, float(avg_service_time if avg_service_time is not None else 8.0))
    safe_hour = int(hour) if hour is not None and 0 <= hour <= 23 else now.hour
    safe_day_of_week = int(day_of_week) if day_of_week is not None and 0 <= day_of_week <= 6 else now.weekday()
    safe_historical_queue = (
        max(0.0, float(historical_queue))
        if historical_queue is not None
        else float(safe_queue_length)
    )
    safe_crowd_reports = (
        min(4.0, max(1.0, float(crowd_reports)))
        if crowd_reports is not None
        else 1.0
    )
    safe_completion_rate = (
        max(0.5, float(completion_rate))
        if completion_rate is not None
        else round(60.0 / safe_avg_service_time, 2)
    )

    # Fast path for empty queues
    if safe_queue_length == 0:
        return {
            "predicted_wait_minutes": 0.0,
            "crowd_level": "LOW",
            "confidence_level": 0.99,
            "confidence_metric_type": "deterministic_zero_queue_bound",
            "model_version": "1.2.0-rf-demo",
            "method": "zero_queue_instant_intake",
            "prediction_interval": {"lower": 0.0, "upper": 0.0},
            "disclaimer": (
                "DISCLAIMER: Model trained on synthetic demonstration data. "
                "Never claim synthetic accuracy represents real-world accuracy."
            ),
            "model_limitations": [
                "Assumes real-time counter availability without unexpected desk closures.",
                "Synthetic simulation cannot replace on-site physical sensors.",
            ],
        }

    # Attempt ML model inference
    bundle = load_model(model_path)

    if bundle is not None and "model" in bundle:
        model = bundle["model"]
        input_df = pd.DataFrame([[
            safe_queue_length,
            safe_active_counters,
            safe_avg_service_time,
            safe_hour,
            safe_day_of_week,
            safe_historical_queue,
            safe_crowd_reports,
            safe_completion_rate,
        ]], columns=FEATURE_NAMES)

        try:
            raw_pred = float(model.predict(input_df)[0])
            # Prevent negative waiting time predictions
            pred_minutes = max(0.5, round(raw_pred, 2))
            confidence, lower_bound, upper_bound = compute_confidence_heuristic(
                model, input_df, pred_minutes
            )
            method = "RandomForestRegressor"
            model_version = bundle.get("model_version", "1.2.0-rf-demo")
            confidence_type = "calibrated_tree_variance_heuristic"
        except Exception as inference_err:
            # Fallback if inference computation fails
            pred_minutes = fallback_baseline_prediction(
                safe_queue_length, safe_active_counters, safe_avg_service_time
            )
            confidence = 0.70
            lower_bound = max(0.0, round(pred_minutes * 0.75, 2))
            upper_bound = round(pred_minutes * 1.30, 2)
            method = f"baseline_formula_fallback (Reason: {inference_err})"
            model_version = "deterministic-baseline-1.0"
            confidence_type = "heuristic_baseline_approximation"
    else:
        # Model artifact not found -> Transparent Mathematical Baseline Fallback
        pred_minutes = fallback_baseline_prediction(
            safe_queue_length, safe_active_counters, safe_avg_service_time
        )
        confidence = 0.70
        lower_bound = max(0.0, round(pred_minutes * 0.75, 2))
        upper_bound = round(pred_minutes * 1.30, 2)
        method = "deterministic_mathematical_baseline_fallback"
        model_version = "deterministic-baseline-1.0"
        confidence_type = "heuristic_baseline_approximation"

    crowd_level = calculate_crowd_level(pred_minutes)

    return {
        "predicted_wait_minutes": pred_minutes,
        "crowd_level": crowd_level,
        "confidence_level": confidence,
        "confidence_metric_type": confidence_type,
        "model_version": model_version,
        "method": method,
        "prediction_interval": {
            "lower": lower_bound,
            "upper": upper_bound,
        },
        "input_summary": {
            "queue_length": safe_queue_length,
            "active_counters": safe_active_counters,
            "avg_service_time": safe_avg_service_time,
            "hour": safe_hour,
            "day_of_week": safe_day_of_week,
        },
        "disclaimer": (
            "DISCLAIMER: Model trained on synthetic demonstration data. "
            "Never claim synthetic accuracy represents real-world accuracy."
        ),
        "model_limitations": [
            "Trained on simulated queuing theory approximations (M/M/c approximation).",
            "Does not account for unrecorded staff breaks, medical triages, or sudden closures.",
            "Assumes stationary arrival rates within individual hour intervals.",
            "Accuracy in physical production requires field-collected sensor and ticket logs.",
        ],
    }
