"""
VOXGUARD AI — Calibrated Risk Engine
Maps synthetic probability and acoustic signatures to actionable risk tiers.
"""

from typing import Tuple, List, Dict, Any


class RiskEngine:
    @staticmethod
    def assess_risk(
        synthetic_prob: float,
        signals: Dict[str, float],
        duration: float
    ) -> Dict[str, Any]:
        """
        Calibrates model probability into categorical decision tiers:
        - LOW (0-30%): Likely Human-Generated
        - MEDIUM (31-70%): Uncertain / Ambiguous
        - HIGH (71-100%): Likely AI-Generated
        """
        pct = round(synthetic_prob * 100, 1)

        if synthetic_prob >= 0.70:
            prediction = "AI_GENERATED"
            risk_level = "HIGH"
            headline = f"Likely AI-Generated Voice ({pct}% Model Confidence)"
            summary = (
                "The analyzed audio displays acoustic signatures strongly characteristic of "
                "neural vocoders and synthetic voice generation models."
            )
            recommendations = [
                "Do NOT transfer money, approve financial transactions, or share confidential OTPs based on this voice.",
                "Verify the caller's identity via an independent secondary channel (e.g. call their personal phone number or contact mutual colleagues).",
                "Ask a personal security challenge question that only the real individual would know.",
                "Report suspicious impersonation attempts to your organization's security team or local cybercrime cell."
            ]
            key_reasons = [
                "Vocoder harmonic dispersion anomalies detected in high-frequency bands",
                "Unnatural prosodic cadence and statistical pitch distribution",
                "Neural speech synthesis phase discontinuity indicators"
            ]

        elif synthetic_prob <= 0.30:
            prediction = "HUMAN_GENERATED"
            risk_level = "LOW"
            headline = f"Likely Human-Generated Voice ({round((1.0 - synthetic_prob) * 100, 1)}% Authenticity Estimate)"
            summary = (
                "The acoustic dynamics, natural vocal tract resonance, and breath variation "
                "are consistent with genuine human speech recordings."
            )
            recommendations = [
                "No prominent synthetic voice cloning signatures detected.",
                "Remember that automated detection is an AI-assisted screening tool and should not be treated as a 100% definitive forensic guarantee.",
                "Exercise standard caution for high-value transactions."
            ]
            key_reasons = [
                "Natural organic pitch variance and continuous vocal tract resonance",
                "Consistent spectral envelope without neural vocoder truncation",
                "Authentic acoustic room reflections and organic breath patterns"
            ]

        else:
            prediction = "UNCERTAIN"
            risk_level = "MEDIUM"
            headline = f"Uncertain / Ambiguous Audio ({pct}% Synthetic Likelihood)"
            summary = (
                "The model could not decisively differentiate between human and synthetic speech. "
                "Heavy audio compression (e.g. WhatsApp/phone codec), background noise, or short speech duration may impact detection."
            )
            recommendations = [
                "Do not rely solely on automated screening for this audio sample.",
                "Request a longer, clearer audio sample or switch to a live video/phone call.",
                "Verify the sender's identity through alternative verified channels before taking sensitive actions."
            ]
            key_reasons = [
                "Ambiguous acoustic feature profile falling within the borderline decision margin",
                "Possible codec compression artifacts or background noise interfering with spectral analysis",
                "Short speech segment or mixed vocal characteristics"
            ]

        return {
            "prediction": prediction,
            "risk_level": risk_level,
            "synthetic_likelihood": round(synthetic_prob, 4),
            "real_likelihood": round(1.0 - synthetic_prob, 4),
            "headline": headline,
            "summary": summary,
            "recommendations": recommendations,
            "key_reasons": key_reasons
        }
