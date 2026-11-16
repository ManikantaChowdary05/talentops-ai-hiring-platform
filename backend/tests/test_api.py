import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_get_dashboard_analytics():
    response = client.get("/api/v1/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "summary_kpis" in data
    assert "charts" in data
    kpis = data["summary_kpis"]
    assert kpis["total_requisitions"] > 0
    assert kpis["total_candidates"] > 0
    assert kpis["conversion_rate"] >= 0

def test_requisitions_endpoint():
    response = client.get("/api/v1/requisitions")
    assert response.status_code == 200
    reqs = response.json()
    assert len(reqs) > 0
    assert "requisition_id" in reqs[0]

def test_candidates_endpoint():
    response = client.get("/api/v1/candidates?limit=10")
    assert response.status_code == 200
    cands = response.json()
    assert len(cands) == 10
    assert "candidate_id" in cands[0]

def test_exceptions_endpoint():
    response = client.get("/api/v1/exceptions")
    assert response.status_code == 200
    exceptions = response.json()
    assert len(exceptions) >= 5

def test_copilot_query():
    response = client.post("/api/v1/copilot/query", json={"query": "What are the 5 mandatory anomalies?"})
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "mandatory" in data["answer"].lower() or "anomalies" in data["answer"].lower()
