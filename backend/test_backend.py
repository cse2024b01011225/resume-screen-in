import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

def test_health_check():
    with TestClient(app) as client:
        # 1. Test root endpoint
        root_response = client.get("/")
        print("GET / -> Status:", root_response.status_code)
        assert root_response.status_code == 200, f"Expected 200, got {root_response.status_code}"
        root_data = root_response.json()
        print("Root payload:", root_data)
        assert "health_check" in root_data
        assert root_data.get("service") == "Resume Screen-In"

        # 2. Test /api/health endpoint
        health_response = client.get("/api/health")
        print("\nGET /api/health -> Status:", health_response.status_code)
        assert health_response.status_code == 200, f"Expected 200, got {health_response.status_code}"
        health_data = health_response.json()
        print("Health payload:", health_data)
        assert health_data["status"] == "healthy"
        assert health_data["database"] == "connected"
        assert "python_version" in health_data

    print("\n[SUCCESS] Backend health check test passed completely!")

if __name__ == "__main__":
    test_health_check()
