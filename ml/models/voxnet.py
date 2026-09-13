"""
VOXGUARD AI — VoxNet Deep Spectro-Acoustic Detection Model
Dual-Path PyTorch Architecture for Robust Voice-Cloning & Impersonation Detection.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple, Dict, Any


class SqueezeExcitation(nn.Module):
    def __init__(self, channels: int, reduction: int = 8):
        super().__init__()
        self.fc = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(channels, max(channels // reduction, 4)),
            nn.ReLU(inplace=True),
            nn.Linear(max(channels // reduction, 4), channels),
            nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        b, c, _, _ = x.shape
        w = self.fc(x).view(b, c, 1, 1)
        return x * w


class ResidualConvBlock(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, stride: int = 1):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.act = nn.Mish(inplace=True)
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3, stride=1, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_channels)
        self.se = SqueezeExcitation(out_channels)

        self.shortcut = nn.Sequential()
        if stride != 1 or in_channels != out_channels:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm2d(out_channels)
            )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        res = self.shortcut(x)
        out = self.act(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out = self.se(out)
        out = self.act(out + res)
        return out


class VoxNet(nn.Module):
    """
    Dual-Path Neural Network:
    Path 1: 2D Deep ResNet on Log-Mel Spectrograms [B, 1, 128, 250]
    Path 2: Statistical Acoustic MLP on 52-dim acoustic descriptors [B, 52]
    Fusion: High-order cross-modality representation with Dropout calibration.
    """
    def __init__(self, num_classes: int = 2, acoustic_dim: int = 52):
        super().__init__()

        # Path 1: Spectrogram 2D Feature Extractor
        self.spec_stem = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=5, stride=2, padding=2, bias=False),
            nn.BatchNorm2d(32),
            nn.Mish(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2) # [32, 32, 62]
        )

        self.layer1 = ResidualConvBlock(32, 48, stride=2)   # [48, 16, 31]
        self.layer2 = ResidualConvBlock(48, 64, stride=2)   # [64, 8, 16]
        self.layer3 = ResidualConvBlock(64, 96, stride=2)   # [96, 4, 8]
        self.layer4 = ResidualConvBlock(96, 128, stride=1)  # [128, 4, 8]

        self.spec_pool = nn.AdaptiveAvgPool2d((1, 1))
        self.spec_fc = nn.Sequential(
            nn.Linear(128, 128),
            nn.BatchNorm1d(128),
            nn.Mish(inplace=True)
        )

        # Path 2: 1D Acoustic Statistics Branch
        self.acoustic_mlp = nn.Sequential(
            nn.Linear(acoustic_dim, 64),
            nn.BatchNorm1d(64),
            nn.Mish(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(64, 64),
            nn.BatchNorm1d(64),
            nn.Mish(inplace=True)
        )

        # Fusion & Classification Head
        self.fusion_head = nn.Sequential(
            nn.Linear(128 + 64, 128),
            nn.BatchNorm1d(128),
            nn.Mish(inplace=True),
            nn.Dropout(0.35),
            nn.Linear(128, 64),
            nn.Mish(inplace=True),
            nn.Linear(64, num_classes)
        )

        # Auxiliary Head for Explainability / Vocoder Artifact Estimation (0.0 to 1.0)
        self.artifact_head = nn.Sequential(
            nn.Linear(128 + 64, 32),
            nn.Mish(inplace=True),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )

    def forward(self, mel: torch.Tensor, acoustic: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        mel: [B, 1, 128, 250]
        acoustic: [B, 52]
        Returns: logits [B, 2], artifact_score [B, 1]
        """
        # Path 1
        x_spec = self.spec_stem(mel)
        x_spec = self.layer1(x_spec)
        x_spec = self.layer2(x_spec)
        x_spec = self.layer3(x_spec)
        x_spec = self.layer4(x_spec)
        x_spec = self.spec_pool(x_spec).flatten(1)
        x_spec_emb = self.spec_fc(x_spec)

        # Path 2
        x_acoust_emb = self.acoustic_mlp(acoustic)

        # Fusion
        fused = torch.cat([x_spec_emb, x_acoust_emb], dim=1)
        logits = self.fusion_head(fused)
        artifact_score = self.artifact_head(fused)

        return logits, artifact_score

    @torch.no_grad()
    def predict_probabilities(
        self, mel: torch.Tensor, acoustic: torch.Tensor
    ) -> Dict[str, Any]:
        """
        Inference helper returning softmax probabilities and artifact scores.
        Class 0: REAL / HUMAN
        Class 1: SYNTHETIC / AI_GENERATED
        """
        self.eval()
        logits, artifact_score = self.forward(mel, acoustic)
        probs = F.softmax(logits, dim=-1)[0].cpu().numpy()
        artifact = float(artifact_score[0, 0].cpu().numpy())

        real_prob = float(probs[0])
        synthetic_prob = float(probs[1])

        return {
            "real_probability": real_prob,
            "synthetic_probability": synthetic_prob,
            "artifact_score": artifact
        }
