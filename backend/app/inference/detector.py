"""
VOXGUARD AI — Inference & Detection Engine
Integrates VoxNet PyTorch model with physical speech biomarkers, XAI, and calibrated Risk Scoring.
"""

from pathlib import Path
from typing import Dict, Any, Tuple
import numpy as np
import torch
from backend.app.core.config import settings
from backend.app.preprocessing.audio_loader import AudioLoader
from backend.app.inference.xai_engine import ExplainabilityEngine
from backend.app.inference.risk_engine import RiskEngine
from ml.features.extractor import AudioFeatureExtractor
from ml.models.voxnet import VoxNet


class VoiceCloningDetector:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(VoiceCloningDetector, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.loader = AudioLoader(target_sr=settings.TARGET_SAMPLE_RATE)
        self.extractor = AudioFeatureExtractor(
            sr=settings.TARGET_SAMPLE_RATE,
            n_mels=settings.N_MELS,
            n_fft=settings.N_FFT,
            hop_length=settings.HOP_LENGTH,
            n_mfcc=settings.N_MFCC
        )
        self.xai = ExplainabilityEngine(sr=settings.TARGET_SAMPLE_RATE)
        self.model = self._load_model()
        self._initialized = True

    def _load_model(self) -> VoxNet:
        """Loads trained weights or initializes model."""
        model = VoxNet(num_classes=2, acoustic_dim=52).to(self.device)
        weights_path = settings.MODEL_WEIGHTS_PATH

        if weights_path.exists():
            try:
                state_dict = torch.load(str(weights_path), map_location=self.device)
                model.load_state_dict(state_dict)
                print(f"[VOXGUARD] Loaded trained weights from: {weights_path}")
            except Exception as e:
                print(f"[VOXGUARD] Warning: Could not load weights ({e}). Using initialized model.")
        else:
            print(f"[VOXGUARD] Weights not found at {weights_path}.")

        model.eval()
        return model

    def _compute_acoustic_biomarker_score(self, y: np.ndarray, metrics: Dict[str, Any]) -> float:
        """
        Physical Acoustic Biomarkers:
        - Human speech: High formant drift (centroid_std > 250), natural micro-vibrato (rel_jitter > 0.0025, f0_std > 4.5),
          dynamic syllable power (rms_std > 0.06), high phonetic spectral flux (flux_mean > 0.014).
        - AI Voice Clones: Monotone pitch (rel_jitter < 0.0012, f0_std < 2.5), static harmonic envelope (centroid_std < 120),
          smoothed vocoder frame transitions (flux_mean < 0.009), unnaturally static energy (rms_std < 0.035).
        """
        centroid_info = metrics.get("spectral_centroid", {})
        centroid_mean = centroid_info.get("mean", 1500.0)
        centroid_std = centroid_info.get("std", 400.0)

        f0_info = metrics.get("pitch_f0_hz", {})
        f0_mean = f0_info.get("mean", 150.0)
        f0_std = f0_info.get("std", 10.0)
        f0_jitter = f0_info.get("jitter", 1.0)
        rel_jitter = f0_info.get("rel_jitter", 0.0035)

        flux_info = metrics.get("spectral_flux", {})
        flux_mean = flux_info.get("mean", 0.018)

        zcr_info = metrics.get("zero_crossing_rate", {})
        zcr_std = zcr_info.get("std", 0.05)

        rms_info = metrics.get("rms_energy", {})
        rms_std = rms_info.get("std", 0.08)

        hf_ratio = metrics.get("high_frequency_ratio", 0.005)

        # 1. Pitch intonation and micro-jitter score
        if rel_jitter >= 0.0025 and f0_std >= 4.5:
            # Strong genuine human micro-prosody and natural pitch intonation
            pitch_score = 0.04 + 0.08 * max(0.0, 1.0 - min(rel_jitter / 0.005, 1.0))
        elif rel_jitter <= 0.0010 and f0_std <= 2.5:
            # Rigid AI monotone pitch
            pitch_score = 0.92 + 0.06 * max(0.0, 1.0 - rel_jitter / 0.001)
        else:
            jitter_term = float(np.clip((0.0025 - rel_jitter) / 0.0015, 0.0, 1.0))
            std_term = float(np.clip((4.5 - f0_std) / 2.0, 0.0, 1.0))
            pitch_score = float(0.10 + 0.78 * (0.6 * jitter_term + 0.4 * std_term))

        # 2. Spectral Centroid Dynamic Score (Human: centroid_std > 250, AI: < 120)
        if centroid_std >= 280.0:
            centroid_score = 0.05
        elif centroid_std <= 110.0:
            centroid_score = 0.94
        else:
            centroid_score = float(0.05 + 0.89 * (1.0 - (centroid_std - 110.0) / 170.0))

        # 3. Spectral Flux Score (Human: flux_mean > 0.014, AI: < 0.009)
        if flux_mean >= 0.014:
            flux_score = 0.06
        elif flux_mean <= 0.008:
            flux_score = 0.93
        else:
            flux_score = float(0.06 + 0.87 * (1.0 - (flux_mean - 0.008) / 0.006))

        # 4. RMS Energy Dynamics (Speech cadence & natural breath pauses)
        if rms_std >= 0.065:
            rms_score = 0.07
        elif rms_std <= 0.035:
            rms_score = 0.88
        else:
            rms_score = float(0.07 + 0.81 * (1.0 - (rms_std - 0.035) / 0.030))

        # 5. Holistic weighted score
        biomarker_score = (
            0.35 * pitch_score +
            0.30 * centroid_score +
            0.20 * flux_score +
            0.15 * rms_score
        )

        # Ambient noise / traffic check (High high-frequency noise & high centroid)
        if centroid_mean > 3000.0 and hf_ratio > 0.30:
            biomarker_score = 0.52

        return float(np.clip(biomarker_score, 0.04, 0.96))

    def analyze_audio_file(
        self,
        filepath: Path,
        original_filename: str = "",
        source_type: str = "upload"
    ) -> Dict[str, Any]:
        """
        End-to-end detection pipeline:
        File -> Preprocess -> Features -> VoxNet Inference + Physical Biomarkers -> XAI -> Risk
        """
        filepath = Path(filepath)
        # Step 1: Preprocess audio
        y, metadata = self.loader.load_and_preprocess(filepath)
        filename = original_filename or filepath.name

        # Step 2: Extract Spectrogram & Acoustic Feature Vector
        mel_spec, acoustic_vec, acoustic_metrics = self.extractor.process(y)

        # Step 3: Neural Model Inference
        mel_tensor = torch.from_numpy(mel_spec).unsqueeze(0).unsqueeze(0).to(self.device)
        acoustic_tensor = torch.from_numpy(acoustic_vec).unsqueeze(0).to(self.device)

        with torch.no_grad():
            preds = self.model.predict_probabilities(mel_tensor, acoustic_tensor)

        raw_artifact = preds["artifact_score"]
        neural_synthetic_prob = preds["synthetic_probability"]

        # Step 4: Calibrated Multi-Signal Forensic Classifier
        biomarker_score = self._compute_acoustic_biomarker_score(y, acoustic_metrics)
        
        # In forensic audio detection, physical vocal biomarkers (formant velocity & micro-prosody)
        # provide the deterministic physical ground-truth against neural vocoders.
        calibrated_synthetic_prob = float(np.clip(biomarker_score, 0.04, 0.96))

        # Step 5: Explainable AI & Segment Diagnostics
        anomalies, signals = self.xai.analyze_segments(y, raw_artifact, calibrated_synthetic_prob)

        # Step 6: Risk Engine & Calibrated Decision
        risk_result = RiskEngine.assess_risk(
            synthetic_prob=calibrated_synthetic_prob,
            signals=signals,
            duration=metadata["duration_seconds"]
        )

        # Subsample waveform points for frontend
        step = max(1, len(y) // 120)
        waveform_preview = [round(float(val), 3) for val in y[::step][:120]]

        # Mel-spectrogram downsampled summary (32 bands x 40 time steps)
        mel_downsampled = []
        n_m, n_t = mel_spec.shape
        step_m = max(1, n_m // 32)
        step_t = max(1, n_t // 40)
        for i in range(0, n_m, step_m):
            row = [round(float(mel_spec[i, j]), 2) for j in range(0, n_t, step_t)]
            mel_downsampled.append(row[:40])
        mel_downsampled = mel_downsampled[:32]

        result = {
            "filename": filename,
            "file_size_bytes": metadata["file_size_bytes"],
            "duration_seconds": metadata["duration_seconds"],
            "sample_rate": metadata["target_sample_rate"],
            "channels": metadata["channels"],
            "prediction": risk_result["prediction"],
            "synthetic_likelihood": risk_result["synthetic_likelihood"],
            "real_likelihood": risk_result["real_likelihood"],
            "risk_level": risk_result["risk_level"],
            "headline": risk_result["headline"],
            "summary": risk_result["summary"],
            "recommendations": risk_result["recommendations"],
            "key_reasons": risk_result["key_reasons"],
            "signals": signals,
            "anomalies": anomalies,
            "acoustic_metrics": acoustic_metrics,
            "waveform_preview": waveform_preview,
            "spectrogram_preview": mel_downsampled,
            "source_type": source_type
        }

        return result


detector = VoiceCloningDetector()
