"""
VOXGUARD AI — Preprocessing Tests
"""

import pytest
import numpy as np
import soundfile as sf
from pathlib import Path
from backend.app.preprocessing.audio_loader import AudioLoader
from backend.app.preprocessing.resampler import resample_audio


def test_resampler():
    orig_sr = 44100
    target_sr = 16000
    duration = 2.0
    t = np.linspace(0, duration, int(orig_sr * duration))
    sine_wave = np.sin(2 * np.pi * 440 * t).astype(np.float32)

    resampled = resample_audio(sine_wave, orig_sr, target_sr)
    assert len(resampled) == int(target_sr * duration)
    assert resampled.dtype == np.float32


def test_audio_loader_valid(tmp_path):
    # Create temporary WAV file
    sr = 22050
    duration = 3.0
    t = np.linspace(0, duration, int(sr * duration))
    wave = (0.5 * np.sin(2 * np.pi * 300 * t)).astype(np.float32)

    wav_file = tmp_path / "test_audio.wav"
    sf.write(str(wav_file), wave, sr)

    loader = AudioLoader(target_sr=16000)
    y, metadata = loader.load_and_preprocess(wav_file)

    assert metadata["target_sample_rate"] == 16000
    assert metadata["channels"] == 1
    assert metadata["duration_seconds"] > 2.0
    assert y.ndim == 1
    assert np.max(np.abs(y)) <= 1.01
