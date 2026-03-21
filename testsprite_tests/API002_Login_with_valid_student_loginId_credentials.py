import requests

def test_login_with_valid_student_loginId_credentials():
    base_url = "http://localhost:4000"
    login_endpoint = f"{base_url}/api/auth/login"
    payload = {
        "loginId": "UJAAS-2026-007",
        "password": "ashish@123"
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(login_endpoint, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        json_response = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"

    assert ("token" in json_response and isinstance(json_response["token"], str) and json_response["token"]), \
        f"Response JSON does not contain valid 'token': {json_response}"

test_login_with_valid_student_loginId_credentials()