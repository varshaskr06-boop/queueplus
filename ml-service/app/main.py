"""
QueuePulse AI - ML Service Entry Point
Re-exports the application defined in app.py for backward compatibility.
"""

from app import app

if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app:app", host=host, port=port, reload=True)
