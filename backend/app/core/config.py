"""
VOXGUARD AI — Backend Configuration
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BASE_DIR.parent


class Settings:
    PROJECT_NAME: str = "VOXGUARD AI"
    TAGLINE: str = "Hear a voice. Verify its authenticity."
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

    # Security & Uploads
    MAX_FILE_SIZE_BYTES: int = 25 * 1024 * 1024  # 25MB
    MIN_AUDIO_DURATION_SEC: float = 1.0          # Minimum 1.0 second
    MAX_AUDIO_DURATION_SEC: float = 180.0        # Maximum 3 minutes
    ALLOWED_EXTENSIONS: set = {".wav", ".mp3", ".m4a", ".flac", ".ogg", ".webm"}
    
    # Paths
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    DEMO_AUDIO_DIR: Path = PROJECT_ROOT / "demo"
    MODEL_WEIGHTS_PATH: Path = BASE_DIR / "app" / "models" / "voxnet.pt"
    DATABASE_PATH: Path = BASE_DIR / "voxguard.db"

    # Audio Preprocessing Specs
    TARGET_SAMPLE_RATE: int = 16000
    N_MELS: int = 128
    N_FFT: int = 512
    HOP_LENGTH: int = 256
    N_MFCC: int = 20

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]


settings = Settings()

# Ensure required directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.DEMO_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
settings.MODEL_WEIGHTS_PATH.parent.mkdir(parents=True, exist_ok=True)
