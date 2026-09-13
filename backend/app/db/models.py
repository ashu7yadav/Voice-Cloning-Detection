"""
VOXGUARD AI — Database Models
"""

import json
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Text, DateTime
from backend.app.db.database import Base


class AnalysisRecord(Base):
    __tablename__ = "analysis_records"

    id = Column(String(64), primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    duration_seconds = Column(Float, nullable=False)
    sample_rate = Column(Integer, default=16000)
    channels = Column(Integer, default=1)
    
    # Model predictions
    prediction = Column(String(32), nullable=False)  # 'AI_GENERATED', 'HUMAN_GENERATED', 'UNCERTAIN'
    synthetic_likelihood = Column(Float, nullable=False)  # 0.0 to 1.0
    real_likelihood = Column(Float, nullable=False)       # 0.0 to 1.0
    risk_level = Column(String(16), nullable=False)        # 'LOW', 'MEDIUM', 'HIGH'
    
    # Explainability Acoustic Metrics (0 - 100)
    spectral_consistency = Column(Float, nullable=False)
    prosody_consistency = Column(Float, nullable=False)
    pitch_variation = Column(Float, nullable=False)
    artifact_score = Column(Float, nullable=False)
    
    # Stored JSON strings for segment highlights and detailed telemetry
    anomalies_json = Column(Text, default="[]")
    metrics_json = Column(Text, default="{}")
    recommendation = Column(Text, nullable=True)
    
    # Metadata
    source_type = Column(String(32), default="upload")  # 'upload', 'recording', 'demo'
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "file_size_bytes": self.file_size_bytes,
            "duration_seconds": self.duration_seconds,
            "sample_rate": self.sample_rate,
            "channels": self.channels,
            "prediction": self.prediction,
            "synthetic_likelihood": round(self.synthetic_likelihood, 4),
            "real_likelihood": round(self.real_likelihood, 4),
            "risk_level": self.risk_level,
            "signals": {
                "spectral_consistency": round(self.spectral_consistency, 1),
                "prosody_consistency": round(self.prosody_consistency, 1),
                "pitch_variation": round(self.pitch_variation, 1),
                "artifact_score": round(self.artifact_score, 1)
            },
            "anomalies": json.loads(self.anomalies_json) if self.anomalies_json else [],
            "metrics": json.loads(self.metrics_json) if self.metrics_json else {},
            "recommendation": self.recommendation,
            "source_type": self.source_type,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
