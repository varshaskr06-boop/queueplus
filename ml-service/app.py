"""
QueuePulse AI - ML Service FastAPI Application
Provides endpoints for queue wait-time prediction and service health checks.
Powered by RandomForestRegressor with automatic mathematical baseline fallback.
"""

import os
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from prediction import load_model, predict_wait_time, DEFAULT_MODEL_PATH, FEATURE_NAMES

load_dotenv()

app = FastAPI(
    title="QueuePulse AI - ML Prediction Engine",
    description=(
        "Machine Learning Service for public facility wait-time forecasting. "
        "Trained on synthetic queuing simulations with deterministic fallback safeguards."
    ),
    version="1.2.0",
)

# Enable CORS
cors_origins_env = os.getenv("CORS_ORIGINS", "*")
allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------------
# Schemas
# -------------------------------------------------------------------------
class PredictionInput(BaseModel):
    # 8 Core Input Features
    queue_length: Optional[int] = Field(
        default=0,
        description="Current number of waiting patrons in queue",
        example=14,
    )
    active_counters: Optional[int] = Field(
        default=3,
        description="Number of currently operating service desks/counters",
        example=3,
    )
    avg_service_time: Optional[float] = Field(
        default=None,
        description="Average service duration per patron in minutes",
        example=8.5,
    )
    hour: Optional[int] = Field(
        default=None,
        description="Hour of day (0-23). Defaults to current server hour if omitted",
        example=14,
    )
    day_of_week: Optional[int] = Field(
        default=None,
        description="Day of week (0=Monday, 6=Sunday). Defaults to current server day if omitted",
        example=2,
    )
    historical_queue: Optional[float] = Field(
        default=None,
        description="Historical rolling queue average for this time window",
        example=12.0,
    )
    crowd_reports: Optional[float] = Field(
        default=1.0,
        description="Recent crowd feedback score (1.0=Low, 2.0=Moderate, 3.0=High, 4.0=Critical)",
        example=2.0,
    )
    completion_rate: Optional[float] = Field(
        default=None,
        description="Recent patron throughput per counter per hour",
        example=7.0,
    )

    # Optional alias fields for backwards compatibility
    hour_of_day: Optional[int] = None
    service_rate: Optional[float] = None
    arrival_rate: Optional[float] = None

class PredictionInterval(BaseModel):
    lower: float
    upper: float

class PredictionOutput(BaseModel):
    predicted_wait_minutes: float
    predicted_wait_time_minutes: float  # Compatibility alias
    crowd_level: str
    confidence_level: float
    model_version: str
    method: str
    confidence_metric_type: str
    prediction_interval: Optional[PredictionInterval] = None
    disclaimer: str
    model_limitations: List[str]

# -------------------------------------------------------------------------
# Exception Handler for Malformed / Non-JSON Input
# -------------------------------------------------------------------------
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=400,
        content={
            "error": "InvalidInputError",
            "message": f"Unable to process input payload: {str(exc)}",
            "fallback_available": True,
        },
    )

# -------------------------------------------------------------------------
# Lifecycle Events
# -------------------------------------------------------------------------
@app.on_event("startup")
def startup_event():
    # Warm up / verify model bundle
    bundle = load_model(DEFAULT_MODEL_PATH)
    if bundle:
        print("[QueuePulse ML Engine] RandomForestRegressor model bundle successfully loaded.")
    else:
        print("[QueuePulse ML Engine] Model file not found on startup. Transparent mathematical baseline fallback is armed.")

# -------------------------------------------------------------------------
# Health Check Endpoint (GET /health)
# -------------------------------------------------------------------------
@app.get("/health")
def health_check():
    bundle = load_model(DEFAULT_MODEL_PATH)
    is_loaded = bundle is not None and "model" in bundle

    return {
        "status": "ok",
        "service": "QueuePulse AI - ML Prediction Engine",
        "model_loaded": is_loaded,
        "algorithm": "RandomForestRegressor",
        "model_version": bundle.get("model_version", "1.2.0-rf-demo") if is_loaded else "baseline-fallback-active",
        "input_features": FEATURE_NAMES,
        "baseline_fallback_ready": True,
        "synthetic_data_notice": (
            "NOTICE: Trained on synthetic demonstration data. "
            "Never claim synthetic accuracy represents real-world accuracy."
        ),
    }

# -------------------------------------------------------------------------
# Model Information & Evaluation Metadata
# -------------------------------------------------------------------------
@app.get("/model-info")
def model_info():
    bundle = load_model(DEFAULT_MODEL_PATH)
    if not bundle:
        return {
            "status": "baseline_mode",
            "message": "Model bundle artifact not present. System is operating in deterministic queuing baseline mode.",
            "baseline_formula": "Wait Time = (queue_length / max(1, active_counters)) * avg_service_time",
        }

    return {
        "model_type": bundle.get("model_type"),
        "model_version": bundle.get("model_version"),
        "feature_names": bundle.get("feature_names"),
        "metrics": bundle.get("metrics"),
        "baseline_comparison": bundle.get("baseline_comparison"),
        "feature_importances": bundle.get("feature_importances"),
        "synthetic_notice": bundle.get("synthetic_notice"),
        "limitations": bundle.get("limitations"),
        "created_at": bundle.get("created_at"),
    }

# -------------------------------------------------------------------------
# Prediction Endpoint (POST /predict)
# -------------------------------------------------------------------------
@app.post("/predict", response_model=PredictionOutput)
def predict(payload: PredictionInput):
    """
    Predict estimated queue waiting time in minutes based on 8 operational features.
    Guarantees non-negative prediction, provides calibrated tree variance confidence,
    and falls back to deterministic queuing formula if model is offline.
    """
    # Handle aliases
    effective_hour = payload.hour if payload.hour is not None else payload.hour_of_day
    
    # Calculate effective avg_service_time from service_rate if avg_service_time omitted
    if payload.avg_service_time is not None:
        effective_service_time = payload.avg_service_time
    elif payload.service_rate is not None and payload.service_rate > 0:
        effective_service_time = round(60.0 / payload.service_rate, 2)
    else:
        effective_service_time = 8.5

    # Completion rate fallback
    effective_completion_rate = payload.completion_rate
    if effective_completion_rate is None and payload.service_rate is not None:
        effective_completion_rate = payload.service_rate

    result = predict_wait_time(
        queue_length=payload.queue_length,
        active_counters=payload.active_counters,
        avg_service_time=effective_service_time,
        hour=effective_hour,
        day_of_week=payload.day_of_week,
        historical_queue=payload.historical_queue,
        crowd_reports=payload.crowd_reports,
        completion_rate=effective_completion_rate,
        model_path=DEFAULT_MODEL_PATH,
    )

    # Attach backward compatible alias
    result["predicted_wait_time_minutes"] = result["predicted_wait_minutes"]

    return result

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app:app", host=host, port=port, reload=True)
