import requests

def test_api001_backend_health_endpoint_responds():
    base_url = "http://localhost:4000"
    health_url = f"{base_url}/root/health"
    auth = ('student@ujaas.com', 'student123')
    try:
        response = requests.get(health_url, auth=auth, timeout=30)
        response.raise_for_status()
        assert response.status_code == 200
        # Optionally check response content if any expected schema is known
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_api001_backend_health_endpoint_responds()