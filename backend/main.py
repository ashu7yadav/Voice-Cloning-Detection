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
from fastapi.responses import JSONResponse, FileResponse

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

# CORS Middleware (Allows all in production / configured origins)
cors_origins = settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"]
if "*" not in cors_origins:
    cors_origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix=settings.API_PREFIX)

# Mount demo audio files directory if it exists
if settings.DEMO_AUDIO_DIR.exists():
    app.mount("/demo-audio", StaticFiles(directory=str(settings.DEMO_AUDIO_DIR)), name="demo-audio")

# Mount Production Frontend (React build in frontend/dist) if present
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API and docs to pass through
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("demo-audio"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

else:
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


if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8001))
    print(f"[*] Starting {settings.PROJECT_NAME} Server on http://{host}:{port} ...")
    uvicorn.run("backend.main:app", host=host, port=port, reload=False)
