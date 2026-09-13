"""
VOXGUARD AI — Audio Resampler
Standardizes sampling rates to target 16kHz mono.
"""

import numpy as np
import librosa
from scipy import signal


def resample_audio(y: np.ndarray, orig_sr: int, target_sr: int = 16000) -> np.ndarray:
    """
    Resamples audio array to target sample rate.
    """
    if orig_sr == target_sr:
        return y.astype(np.float32)

    try:
        resampled = librosa.resample(y, orig_sr=orig_sr, target_sr=target_sr)
        return resampled.astype(np.float32)
    except Exception:
        # Fallback to scipy signal resample if needed
        num_samples = int(len(y) * float(target_sr) / orig_sr)
        resampled = signal.resample(y, num_samples)
        return resampled.astype(np.float32)
