"""
VOXGUARD AI — Audio Loader & Preprocessing Pipeline
Handles multi-format audio decoding (including browser WEBM/OPUS via FFmpeg fallback),
downmixing, silence trimming, and length validation.
"""

import io
import subprocess
from pathlib import Path
from typing import Tuple, Dict, Any
import numpy as np
import soundfile as sf
import librosa
from fastapi import HTTPException, status
from backend.app.core.config import settings
from backend.app.preprocessing.resampler import resample_audio

try:
    import imageio_ffmpeg
    FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    FFMPEG_EXE = "ffmpeg"


class AudioLoader:
    def __init__(self, target_sr: int = 16000):
        self.target_sr = target_sr

    def _decode_via_ffmpeg(self, filepath: Path) -> Tuple[np.ndarray, int]:
        """
        Decodes any arbitrary audio format (WEBM, OPUS, OGG, M4A, AAC)
        directly into 16kHz mono PCM float32 using imageio-ffmpeg.
        """
        cmd = [
            FFMPEG_EXE,
            "-v", "error",
            "-i", str(filepath),
            "-vn",                  # No video
            "-ac", "1",             # Mono
            "-ar", str(self.target_sr), # 16000 Hz
            "-f", "wav",            # Output WAV container
            "-"                     # Pipe to stdout
        ]
        try:
            proc = subprocess.run(cmd, capture_output=True, check=True)
            wav_bytes = io.BytesIO(proc.stdout)
            data, sr = sf.read(wav_bytes, dtype="float32")
            return data, sr
        except Exception as e:
            raise RuntimeError(f"FFmpeg decoding failed: {str(e)}")

    def load_and_preprocess(self, filepath: Path) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Loads audio from file, converts to mono, resamples to 16kHz,
        trims excessive silence, normalizes amplitude, and validates length.
        """
        filepath = Path(filepath)
        if not filepath.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Audio file not found: {filepath.name}"
            )

        orig_channels = 1
        orig_sr = self.target_sr
        y = None

        # Method 1: Try soundfile / librosa first (fastest for WAV/FLAC)
        try:
            data, sr = sf.read(str(filepath), dtype="float32")
            if data.ndim > 1:
                orig_channels = data.shape[1]
                y = np.mean(data, axis=1)
            else:
                y = data
            orig_sr = sr
        except Exception:
            pass

        # Method 2: Try librosa.load
        if y is None:
            try:
                data, sr = librosa.load(str(filepath), sr=None, mono=False)
                if data.ndim > 1:
                    orig_channels = data.shape[0]
                    y = np.mean(data, axis=0)
                else:
                    y = data
                orig_sr = sr
            except Exception:
                pass

        # Method 3: Robust FFmpeg fallback (handles WEBM/OPUS/M4A/OGG from browsers)
        if y is None:
            try:
                y, orig_sr = self._decode_via_ffmpeg(filepath)
                orig_channels = 1
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Could not decode audio file '{filepath.name}'. Format not supported or file corrupted. Error: {str(e)}"
                )

        y = y.astype(np.float32)

        # Resample to target_sr (16kHz) if not already
        if orig_sr != self.target_sr:
            y = resample_audio(y, orig_sr=orig_sr, target_sr=self.target_sr)

        # Remove DC offset
        y = y - np.mean(y)

        # Peak normalization
        max_val = np.max(np.abs(y))
        if max_val > 1e-6:
            y = y / max_val
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio sample contains no audible sound (silent recording)."
            )

        # Trim leading and trailing silence (top_db=30)
        try:
            y_trimmed, _ = librosa.effects.trim(y, top_db=30)
            if len(y_trimmed) >= self.target_sr * 0.8:
                y = y_trimmed
        except Exception:
            pass

        duration = float(len(y)) / float(self.target_sr)

        # Validate duration
        if duration < settings.MIN_AUDIO_DURATION_SEC:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Audio is too short ({duration:.2f}s). Minimum {settings.MIN_AUDIO_DURATION_SEC}s of speech required."
            )

        if duration > settings.MAX_AUDIO_DURATION_SEC:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Audio exceeds maximum limit ({duration:.1f}s > {settings.MAX_AUDIO_DURATION_SEC}s)."
            )

        metadata = {
            "original_sample_rate": orig_sr,
            "target_sample_rate": self.target_sr,
            "channels": orig_channels,
            "duration_seconds": round(duration, 2),
            "num_samples": len(y),
            "file_size_bytes": filepath.stat().st_size
        }

        return y, metadata
