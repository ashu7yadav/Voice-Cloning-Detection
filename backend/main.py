"""
VOXGUARD AI — FastAPI Application Entrypoint
AI-Powered Voice-Cloning & Impersonation Detection System
"""

import os
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.db.database import init_db
from backend.app.api.routes import router as api_router

# Initialize database tables
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Voice-Cloning & Impersonation Detection System. Analyzes speech for synthetic vocoder artifacts, acoustic anomalies, and impersonation threats.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix=settings.API_PREFIX)

# Mount demo audio files directory if it exists
if settings.DEMO_AUDIO_DIR.exists():
    app.mount("/demo-audio", StaticFiles(directory=str(settings.DEMO_AUDIO_DIR)), name="demo-audio")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "An unexpected server error occurred during audio processing.",
            "detail": str(exc) if settings.DEBUG else "Internal server error"
        }
    )


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "status": "operational",
        "docs": "/docs",
        "api_health": f"{settings.API_PREFIX}/health"
    }


if __name__ == "__main__":
    import uvicorn
    print(f"[*] Starting {settings.PROJECT_NAME} Server on http://127.0.0.1:8001 ...")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8001, reload=False)
