import requests

def test_login_with_valid_student_credentials():
    url = "http://localhost:4000/api/auth/login"
    headers = {"Content-Type": "application/json"}
    payload = {
        "email": "student@ujaas.com",
        "password": "student123"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
        json_response = response.json()
        assert "token" in json_response or "session" in json_response, "Response JSON should contain 'token' or 'session'"
        # Optionally check that token/session is non-empty string
        if "token" in json_response:
            assert isinstance(json_response["token"], str) and json_response["token"], "Token must be a non-empty string"
        if "session" in json_response:
            assert isinstance(json_response["session"], str) and json_response["session"], "Session must be a non-empty string"
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

test_login_with_valid_student_credentials()