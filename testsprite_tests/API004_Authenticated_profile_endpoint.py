import requests

def test_authenticated_profile_endpoint():
    base_url = "http://localhost:4000"
    login_url = f"{base_url}/api/auth/login"
    profile_url = f"{base_url}/api/auth/me"
    login_payload = {
        "loginId": "UJAAS-2026-007",
        "password": "ashish@123"
    }
    try:
        # Login to get auth token/session cookie
        login_response = requests.post(login_url, json=login_payload, timeout=30)
        assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"
        # Prefer token in header, else cookie session
        auth_token = None
        if "token" in login_response.json():
            auth_token = login_response.json()["token"]
            headers = {"Authorization": f"Bearer {auth_token}"}
        else:
            # fallback to cookie session if no token in response
            headers = {}
            if login_response.cookies:
                session_cookies = login_response.cookies
            else:
                raise AssertionError("No auth token or session cookie found after login")

        # Request profile with auth
        profile_response = requests.get(profile_url, headers=headers, cookies=login_response.cookies, timeout=30)
        assert profile_response.status_code == 200, f"Profile request failed with status {profile_response.status_code}"

        profile_data = profile_response.json()
        # Validate profile data has loginId and matches input
        assert profile_data.get("loginId") == "UJAAS-2026-007", "Profile loginId does not match logged in user"
    except requests.RequestException as e:
        raise AssertionError(f"HTTP request failed: {e}")

test_authenticated_profile_endpoint()