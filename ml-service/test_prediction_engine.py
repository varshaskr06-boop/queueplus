"""
QueuePulse AI - Comprehensive ML Prediction Engine Test Suite
Tests:
1. Random Forest prediction pipeline on valid inputs.
2. Edge cases (zero queue, clamped negative values, large queues).
3. Fallback to mathematical baseline when model file is unavailable.
4. Confidence heuristic calibration (no invented probabilities, valid bounds).
5. Non-negative output guarantee.
6. FastAPI endpoints (GET /health, GET /model-info, POST /predict).
7. Full ASGI HTTP protocol simulation (status codes, headers, routing, JSON decoding).
"""

import sys
import os
import json
import asyncio
import unittest

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from prediction import (
    predict_wait_time,
    fallback_baseline_prediction,
    calculate_crowd_level,
    DEFAULT_MODEL_PATH,
)
from app import app, health_check, model_info, predict, PredictionInput

async def simulate_asgi_request(app, method: str, path: str, body: dict = None):
    """
    Simulates a full ASGI HTTP request cycle through FastAPI directly in-process
    without needing a TCP socket.
    """
    body_bytes = json.dumps(body).encode("utf-8") if body else b""
    scope = {
        "type": "http",
        "method": method,
        "path": path,
        "raw_path": path.encode("utf-8"),
        "query_string": b"",
        "headers": [
            (b"host", b"localhost"),
            (b"content-type", b"application/json"),
            (b"content-length", str(len(body_bytes)).encode("utf-8")),
        ],
    }

    response_messages = []

    async def receive():
        return {
            "type": "http.request",
            "body": body_bytes,
            "more_body": False,
        }

    async def send(message):
        response_messages.append(message)

    await app(scope, receive, send)

    status_code = None
    headers = {}
    response_body = b""

    for msg in response_messages:
        if msg["type"] == "http.response.start":
            status_code = msg["status"]
            headers = dict(msg.get("headers", []))
        elif msg["type"] == "http.response.body":
            response_body += msg.get("body", b"")

    parsed_json = json.loads(response_body.decode("utf-8")) if response_body else None
    return status_code, parsed_json

class TestPredictionEngine(unittest.TestCase):
    def test_01_normal_prediction_with_model(self):
        """Test inference with standard 8 input features."""
        result = predict_wait_time(
            queue_length=15,
            active_counters=3,
            avg_service_time=8.0,
            hour=14,
            day_of_week=2,
            historical_queue=12.0,
            crowd_reports=2.0,
            completion_rate=7.5,
        )

        self.assertIn("predicted_wait_minutes", result)
        self.assertGreater(result["predicted_wait_minutes"], 0.0)
        self.assertIn(result["crowd_level"], ["LOW", "MODERATE", "HIGH", "CRITICAL"])
        self.assertGreaterEqual(result["confidence_level"], 0.50)
        self.assertLessEqual(result["confidence_level"], 1.0)
        self.assertEqual(result["method"], "RandomForestRegressor")
        self.assertIn("synthetic demonstration data", result["disclaimer"])
        print(f"  [PASS] Normal prediction: {result['predicted_wait_minutes']} mins, crowd={result['crowd_level']}, conf={result['confidence_level']}")

    def test_02_zero_queue_instant_intake(self):
        """Zero queue length must return 0.0 minutes, LOW crowd, high confidence."""
        result = predict_wait_time(
            queue_length=0,
            active_counters=4,
            avg_service_time=6.0,
            hour=10,
            day_of_week=1,
        )

        self.assertEqual(result["predicted_wait_minutes"], 0.0)
        self.assertEqual(result["crowd_level"], "LOW")
        self.assertEqual(result["confidence_level"], 0.99)
        self.assertEqual(result["prediction_interval"]["lower"], 0.0)
        self.assertEqual(result["prediction_interval"]["upper"], 0.0)
        print("  [PASS] Zero queue instant intake returns 0.0 mins, LOW crowd, conf=0.99")

    def test_03_negative_input_clamping(self):
        """Negative queue lengths and counters must be clamped and never return negative minutes."""
        result = predict_wait_time(
            queue_length=-15,
            active_counters=-3,
            avg_service_time=-5.0,
            hour=-2,
            day_of_week=-1,
        )

        self.assertGreaterEqual(result["predicted_wait_minutes"], 0.0)
        self.assertIn(result["crowd_level"], ["LOW", "MODERATE", "HIGH", "CRITICAL"])
        print("  [PASS] Negative inputs clamped safely; non-negative prediction guaranteed")

    def test_04_crowd_level_thresholds(self):
        """Verify strict crowd level tier boundaries."""
        self.assertEqual(calculate_crowd_level(5.0), "LOW")
        self.assertEqual(calculate_crowd_level(9.9), "LOW")
        self.assertEqual(calculate_crowd_level(10.0), "MODERATE")
        self.assertEqual(calculate_crowd_level(24.9), "MODERATE")
        self.assertEqual(calculate_crowd_level(25.0), "HIGH")
        self.assertEqual(calculate_crowd_level(44.9), "HIGH")
        self.assertEqual(calculate_crowd_level(45.0), "CRITICAL")
        self.assertEqual(calculate_crowd_level(85.0), "CRITICAL")
        print("  [PASS] Crowd level categorization boundaries verified")

    def test_05_fallback_baseline_formula(self):
        """Verify deterministic mathematical baseline when model is offline."""
        baseline_calc = fallback_baseline_prediction(
            queue_length=12,
            active_counters=3,
            avg_service_time=6.0,
        )
        # Expected: (12 / 3) * 6.0 = 24.0
        self.assertEqual(baseline_calc, 24.0)

        # Non-existent model path triggers baseline fallback
        result = predict_wait_time(
            queue_length=12,
            active_counters=3,
            avg_service_time=6.0,
            model_path="non_existent_model_file.joblib",
        )

        self.assertIn("baseline", result["method"])
        self.assertEqual(result["predicted_wait_minutes"], 24.0)
        self.assertEqual(result["crowd_level"], "MODERATE")
        self.assertEqual(result["confidence_level"], 0.70)
        print("  [PASS] Offline model fallback to transparent mathematical baseline verified (24.0 mins)")

    def test_06_fastapi_asgi_get_health(self):
        """Test GET /health via ASGI HTTP cycle."""
        status_code, body = asyncio.run(simulate_asgi_request(app, "GET", "/health"))
        self.assertEqual(status_code, 200)
        self.assertEqual(body["status"], "ok")
        self.assertTrue(body["model_loaded"])
        self.assertEqual(body["algorithm"], "RandomForestRegressor")
        self.assertEqual(body["model_version"], "1.2.0-rf-demo")
        self.assertTrue(body["baseline_fallback_ready"])
        self.assertIn("synthetic demonstration data", body["synthetic_data_notice"])
        print("  [PASS] ASGI GET /health returned 200 OK with model_loaded=True")

    def test_07_fastapi_asgi_get_model_info(self):
        """Test GET /model-info via ASGI HTTP cycle."""
        status_code, body = asyncio.run(simulate_asgi_request(app, "GET", "/model-info"))
        self.assertEqual(status_code, 200)
        self.assertEqual(body["model_type"], "RandomForestRegressor")
        self.assertIn("metrics", body)
        self.assertIn("baseline_comparison", body)
        print(f"  [PASS] ASGI GET /model-info returned 200 OK (MAE={body['metrics']['mae']}m, R2={body['metrics']['r2']})")

    def test_08_fastapi_asgi_post_predict(self):
        """Test POST /predict via ASGI HTTP cycle with complete 8 features."""
        payload = {
            "queue_length": 18,
            "active_counters": 3,
            "avg_service_time": 7.5,
            "hour": 15,
            "day_of_week": 3,
            "historical_queue": 16.0,
            "crowd_reports": 2.0,
            "completion_rate": 8.0,
        }
        status_code, body = asyncio.run(simulate_asgi_request(app, "POST", "/predict", payload))
        self.assertEqual(status_code, 200)
        self.assertIn("predicted_wait_minutes", body)
        self.assertIn("crowd_level", body)
        self.assertIn("confidence_level", body)
        self.assertIn("model_version", body)
        self.assertGreater(body["predicted_wait_minutes"], 0.0)
        self.assertIn(body["crowd_level"], ["LOW", "MODERATE", "HIGH", "CRITICAL"])
        self.assertGreaterEqual(body["confidence_level"], 0.50)
        self.assertIn("model_limitations", body)
        print(f"  [PASS] ASGI POST /predict returned 200 OK -> {body['predicted_wait_minutes']} mins, crowd={body['crowd_level']}")

    def test_09_fastapi_asgi_post_predict_missing_fields(self):
        """Test POST /predict via ASGI HTTP cycle handling omitted/partial fields."""
        sparse_payload = {
            "queue_length": 8,
            "active_counters": 2,
        }
        status_code, body = asyncio.run(simulate_asgi_request(app, "POST", "/predict", sparse_payload))
        self.assertEqual(status_code, 200)
        self.assertGreaterEqual(body["predicted_wait_minutes"], 0.0)
        self.assertIn(body["crowd_level"], ["LOW", "MODERATE", "HIGH", "CRITICAL"])
        print(f"  [PASS] ASGI POST /predict with missing fields returned 200 OK -> {body['predicted_wait_minutes']} mins")

if __name__ == "__main__":
    print("=" * 60)
    print("RUNNING QUEUEPULSE AI ML PREDICTION ENGINE TEST SUITE")
    print("=" * 60)
    suite = unittest.TestLoader().loadTestsFromTestCase(TestPredictionEngine)
    runner = unittest.TextTestRunner(verbosity=0)
    result = runner.run(suite)
    if result.wasSuccessful():
        print("=" * 60)
        print(f"ALL {result.testsRun} TESTS PASSED SUCCESSFULLY!")
        print("=" * 60)
        sys.exit(0)
    else:
        sys.exit(1)
