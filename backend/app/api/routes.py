"""
VOXGUARD AI — REST API Endpoints
"""

import os
import shutil
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import json

from backend.app.core.config import settings
from backend.app.core.security import (
    validate_upload_file,
    generate_secure_filepath,
    cleanup_file,
    sanitize_filename
)
from backend.app.db.database import get_db
from backend.app.db.models import AnalysisRecord
from backend.app.inference.detector import detector

router = APIRouter()


@router.post("/analyze")
async def analyze_audio_upload(
    file: UploadFile = File(...),
    source: Optional[str] = Form("upload"),
    db: Session = Depends(get_db)
):
    """
    Analyzes an uploaded audio file for voice-cloning artifacts and synthetic signatures.
    """
    await validate_upload_file(file)

    file_id, secure_path = generate_secure_filepath(file.filename)

    try:
        # Save file to temporary secure storage
        with open(secure_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Run AI detection pipeline
        analysis_result = detector.analyze_audio_file(
            filepath=secure_path,
            original_filename=file.filename,
            source_type=source or "upload"
        )

        # Persist analysis metadata into SQLite
        record = AnalysisRecord(
            id=file_id,
            filename=analysis_result["filename"],
            file_size_bytes=analysis_result["file_size_bytes"],
            duration_seconds=analysis_result["duration_seconds"],
            sample_rate=analysis_result["sample_rate"],
            channels=analysis_result["channels"],
            prediction=analysis_result["prediction"],
            synthetic_likelihood=analysis_result["synthetic_likelihood"],
            real_likelihood=analysis_result["real_likelihood"],
            risk_level=analysis_result["risk_level"],
            spectral_consistency=analysis_result["signals"]["spectral_consistency"],
            prosody_consistency=analysis_result["signals"]["prosody_consistency"],
            pitch_variation=analysis_result["signals"]["pitch_variation"],
            artifact_score=analysis_result["signals"]["artifact_score"],
            anomalies_json=json.dumps(analysis_result["anomalies"]),
            metrics_json=json.dumps(analysis_result["acoustic_metrics"]),
            recommendation=analysis_result["summary"],
            source_type=source or "upload"
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        analysis_result["id"] = file_id
        analysis_result["created_at"] = record.created_at.isoformat() if record.created_at else None

        return {
            "status": "success",
            "message": "Audio analysis completed successfully.",
            "data": analysis_result
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )
    finally:
        # Privacy-first: remove temporary audio file from disk
        cleanup_file(secure_path)


@router.post("/recording/analyze")
async def analyze_recording(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Direct endpoint for browser microphone audio recordings.
    """
    return await analyze_audio_upload(file=file, source="recording", db=db)


@router.get("/demo/samples")
def get_demo_samples():
    """
    Returns curated benchmark demo audio samples.
    """
    return {
        "status": "success",
        "samples": [
            {
                "id": "demo-human-1",
                "title": "Authentic Human Voice",
                "filename": "human_authentic_sample.wav",
                "audio_url": "/demo-audio/human_authentic_sample.wav",
                "expected_category": "HUMAN_GENERATED",
                "expected_risk": "LOW",
                "description": "Genuine human speech sample displaying natural vocal tract formant dynamics, organic pitch variance, and room acoustics."
            },
            {
                "id": "demo-ai-1",
                "title": "AI Voice Clone (ElevenLabs)",
                "filename": "ai_cloned_elevenlabs.wav",
                "audio_url": "/demo-audio/ai_cloned_elevenlabs.wav",
                "expected_category": "AI_GENERATED",
                "expected_risk": "HIGH",
                "description": "Synthetic voice clone showing vocoder harmonic dispersion, phase glitches, and unnaturally flattened micro-prosody."
            },
            {
                "id": "demo-scam-1",
                "title": "Hindi Emergency Scam ('Beta, hospital...')",
                "filename": "hindi_emergency_scam.wav",
                "audio_url": "/demo-audio/hindi_emergency_scam.wav",
                "expected_category": "AI_GENERATED",
                "expected_risk": "HIGH",
                "description": "High-risk India-specific family emergency voice impersonation scam simulating hospital distress call."
            },
            {
                "id": "demo-unc-1",
                "title": "Uncertain / Heavy Ambient Noise",
                "filename": "uncertain_noisy_recording.wav",
                "audio_url": "/demo-audio/uncertain_noisy_recording.wav",
                "expected_category": "UNCERTAIN",
                "expected_risk": "MEDIUM",
                "description": "Ambiguous recording with heavy background traffic noise and codec degradation falling into the uncertain margin."
            }
        ]
    }


@router.get("/history")
def get_analysis_history(
    search: Optional[str] = Query(None),
    risk: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Retrieves stored scan history logs with optional search & filter.
    """
    query = db.query(AnalysisRecord)

    if risk and risk.upper() in ["LOW", "MEDIUM", "HIGH"]:
        query = query.filter(AnalysisRecord.risk_level == risk.upper())

    if search:
        query = query.filter(AnalysisRecord.filename.ilike(f"%{search}%"))

    total = query.count()
    records = query.order_by(AnalysisRecord.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "status": "success",
        "total": total,
        "items": [r.to_dict() for r in records]
    }


@router.get("/history/{record_id}")
def get_analysis_by_id(record_id: str, db: Session = Depends(get_db)):
    """
    Retrieves a single historical scan report by ID.
    """
    record = db.query(AnalysisRecord).filter(AnalysisRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis record '{record_id}' not found."
        )

    return {
        "status": "success",
        "data": record.to_dict()
    }


@router.delete("/history/{record_id}")
def delete_analysis_record(record_id: str, db: Session = Depends(get_db)):
    """
    Deletes an analysis record (privacy cleanup).
    """
    record = db.query(AnalysisRecord).filter(AnalysisRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis record '{record_id}' not found."
        )

    db.delete(record)
    db.commit()

    return {
        "status": "success",
        "message": f"Record '{record_id}' permanently deleted."
    }


@router.get("/stats")
def get_security_dashboard_stats(db: Session = Depends(get_db)):
    """
    Calculates security metrics and detection distributions for the dashboard.
    """
    total = db.query(AnalysisRecord).count()
    ai_detected = db.query(AnalysisRecord).filter(AnalysisRecord.prediction == "AI_GENERATED").count()
    human_detected = db.query(AnalysisRecord).filter(AnalysisRecord.prediction == "HUMAN_GENERATED").count()
    uncertain = db.query(AnalysisRecord).filter(AnalysisRecord.prediction == "UNCERTAIN").count()
    high_risk = db.query(AnalysisRecord).filter(AnalysisRecord.risk_level == "HIGH").count()
    medium_risk = db.query(AnalysisRecord).filter(AnalysisRecord.risk_level == "MEDIUM").count()
    low_risk = db.query(AnalysisRecord).filter(AnalysisRecord.risk_level == "LOW").count()

    ai_pct = round((ai_detected / total * 100), 1) if total > 0 else 0.0

    # Recent 10 scans
    recent = db.query(AnalysisRecord).order_by(AnalysisRecord.created_at.desc()).limit(10).all()

    return {
        "status": "success",
        "stats": {
            "total_analyzed": total,
            "ai_detected": ai_detected,
            "human_detected": human_detected,
            "uncertain": uncertain,
            "high_risk": high_risk,
            "medium_risk": medium_risk,
            "low_risk": low_risk,
            "ai_detection_percentage": ai_pct
        },
        "recent_activity": [r.to_dict() for r in recent]
    }


@router.get("/health")
def health_check():
    """
    System health check & ML model status.
    """
    import torch
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "model_loaded": detector.model is not None,
        "device": str(detector.device),
        "pytorch_version": torch.__version__,
        "cuda_available": torch.cuda.is_available()
    }
