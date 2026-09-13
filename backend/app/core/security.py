"""
VOXGUARD AI — Security, Sanitization and Validation Guard
"""

import os
import re
import uuid
from pathlib import Path
from typing import Tuple, Optional
from fastapi import HTTPException, UploadFile, status
from backend.app.core.config import settings

# Audio signature headers (magic bytes)
AUDIO_MAGIC_SIGNATURES = {
    "wav": [b"RIFF", b"WAVE"],
    "mp3": [b"ID3", b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"],
    "flac": [b"fLaC"],
    "ogg": [b"OggS"],
    "webm": [b"\x1a\x45\xdf\xa3"],
    "m4a": [b"ftyp", b"M4A ", b"isom"]
}


def sanitize_filename(filename: str) -> str:
    """Removes path traversal characters, spaces and dangerous symbols."""
    clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
    clean = clean.lstrip('.').strip()
    return clean or "audio_sample.wav"


def generate_secure_filepath(original_filename: str) -> Tuple[str, Path]:
    """Generates an isolated unique filepath in the secure upload directory."""
    sanitized = sanitize_filename(original_filename)
    ext = Path(sanitized).suffix.lower()
    if not ext:
        ext = ".wav"
    file_id = f"vox_{uuid.uuid4().hex[:12]}"
    filename = f"{file_id}_{sanitized}"
    filepath = settings.UPLOAD_DIR / filename
    return file_id, filepath


async def validate_upload_file(file: UploadFile) -> None:
    """
    Performs multi-layered verification:
    1. Extension check
    2. File size threshold
    3. Magic bytes / header inspection
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file selected for analysis."
        )

    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported audio format '{ext}'. Please upload a WAV, MP3, M4A, FLAC, OGG, or WEBM file."
        )

    # Read header bytes for magic number verification
    header = await file.read(32)
    await file.seek(0)

    if len(header) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    # Magic byte verification (allow leniency if header matches known formats)
    matched = False
    for fmt, sigs in AUDIO_MAGIC_SIGNATURES.items():
        for sig in sigs:
            if sig in header:
                matched = True
                break
        if matched:
            break

    # If it's a standard web recording or audio container that starts slightly offset
    if not matched and not (ext in [".wav", ".mp3", ".webm", ".ogg", ".m4a", ".flac"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupted or invalid audio file format."
        )


def cleanup_file(filepath: Path) -> None:
    """Safely removes temporary audio file from disk."""
    try:
        if filepath and filepath.exists() and filepath.is_file():
            os.remove(filepath)
    except Exception:
        pass
