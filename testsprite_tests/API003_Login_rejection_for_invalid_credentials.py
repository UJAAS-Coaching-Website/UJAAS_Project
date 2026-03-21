import requests

def test_login_rejection_for_invalid_credentials():
    base_url = "http://localhost:4000"
    url = f"{base_url}/api/auth/login"
    headers = {"Content-Type": "application/json"}
    payload = {
        "email": "student@ujaas.com",
        "password": "wrongpassword123"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 401 or response.status_code == 400, f"Expected 401 or 400, got {response.status_code}"
    json_response = response.json()
    assert "error" in json_response or "message" in json_response, "Response should contain error message"
    error_message = json_response.get("error") or json_response.get("message")
    assert error_message, "Error message should not be empty"

test_login_rejection_for_invalid_credentials()