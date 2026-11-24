from pydantic import BaseModel, Field
from typing import Optional

class QueuePredictionRequest(BaseModel):
    queue_length: int = Field(..., ge=0, description="Current number of people waiting in queue", example=12)
    active_counters: int = Field(..., ge=1, description="Number of currently active service desks/counters", example=3)
    service_rate: float = Field(..., gt=0, description="Average service rate (customers served per hour per counter)", example=6.5)
    arrival_rate: float = Field(..., ge=0, description="Current customer arrival rate (customers per hour)", example=18.0)
    hour_of_day: int = Field(..., ge=0, le=23, description="Hour of the day (0-23)", example=14)
    day_of_week: int = Field(..., ge=0, le=6, description="Day of week (0=Mon, 6=Sun)", example=2)

class QueuePredictionResponse(BaseModel):
    predicted_wait_time_minutes: float
    confidence_interval_lower: float
    confidence_interval_upper: float
    estimated_service_time: float
    recommendation: Optional[str] = None
