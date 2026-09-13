"""
VOXGUARD AI — Feature Extraction & Model Inference Tests
"""

import pytest
import numpy as np
import torch
from ml.features.extractor import AudioFeatureExtractor
from ml.models.voxnet import VoxNet
from backend.app.inference.risk_engine import RiskEngine
from backend.app.inference.xai_engine import ExplainabilityEngine


def test_feature_extractor():
    sr = 16000
    duration = 3.0
    t = np.linspace(0, duration, int(sr * duration))
    y = np.sin(2 * np.pi * 350 * t).astype(np.float32)

    extractor = AudioFeatureExtractor(sr=sr)
    mel, feat_vec, metrics = extractor.process(y)

    assert mel.shape == (128, 250)
    assert feat_vec.shape == (52,)
    assert "spectral_centroid" in metrics
    assert "pitch_f0_hz" in metrics


def test_voxnet_forward():
    model = VoxNet(num_classes=2, acoustic_dim=52)
    model.eval()

    mel = torch.randn(2, 1, 128, 250)
    acoustic = torch.randn(2, 52)

    logits, artifact_score = model(mel, acoustic)
    assert logits.shape == (2, 2)
    assert artifact_score.shape == (2, 1)

    preds = model.predict_probabilities(mel[:1], acoustic[:1])
    assert "real_probability" in preds
    assert "synthetic_probability" in preds
    assert 0.0 <= preds["synthetic_probability"] <= 1.0


def test_risk_engine():
    signals = {"spectral_consistency": 30.0, "prosody_consistency": 40.0, "pitch_variation": 30.0, "artifact_score": 85.0}
    
    # High risk test
    res_high = RiskEngine.assess_risk(0.92, signals, 4.0)
    assert res_high["risk_level"] == "HIGH"
    assert res_high["prediction"] == "AI_GENERATED"

    # Low risk test
    res_low = RiskEngine.assess_risk(0.08, signals, 4.0)
    assert res_low["risk_level"] == "LOW"
    assert res_low["prediction"] == "HUMAN_GENERATED"

    # Uncertain test
    res_unc = RiskEngine.assess_risk(0.52, signals, 4.0)
    assert res_unc["risk_level"] == "MEDIUM"
    assert res_unc["prediction"] == "UNCERTAIN"
