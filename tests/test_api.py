"""
VOXGUARD AI — FastAPI Endpoint & Logic Tests
"""

import pytest
from backend.app.api.routes import get_demo_samples, health_check, get_security_dashboard_stats
from backend.app.db.database import SessionLocal


def test_health_logic():
    res = health_check()
    assert res["status"] == "online"
    assert res["service"] == "VOXGUARD AI"
    assert res["model_loaded"] is True


def test_demo_samples_logic():
    res = get_demo_samples()
    assert res["status"] == "success"
    assert len(res["samples"]) >= 4
    categories = [s["expected_category"] for s in res["samples"]]
    assert "AI_GENERATED" in categories
    assert "HUMAN_GENERATED" in categories


def test_stats_logic():
    db = SessionLocal()
    try:
        res = get_security_dashboard_stats(db=db)
        assert res["status"] == "success"
        assert "stats" in res
        assert "total_analyzed" in res["stats"]
        assert "ai_detected" in res["stats"]
    finally:
        db.close()
