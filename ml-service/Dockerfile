# ==============================================================================
# Production Dockerfile for QueuePulse AI Python ML Service
# ==============================================================================
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production
ENV PORT=8000

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and dataset
COPY . .

# Ensure model artifact exists by executing training pipeline if missing
RUN python -c "import os; os.system('python train.py') if not os.path.exists('models/queue_wait_time_rf.joblib') else print('Model pre-packaged')"

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
