export interface StudentDetails {
  rollNumber: string;
  batch: string;
  joinDate: string | null;
  phone: string;
  address: string;
  dateOfBirth: string | null;
  parentContact: string;
  ratings?: {
    attendance: number;
    assignments: number;
    tests: number;
    participation: number;
    behavior: number;
    engagement: number;
  };
}

export interface UpdateProfilePayload {
  name: string;
  phone: string;
  address: string;
  dateOfBirth: string | null;
  parentContact: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  enrolledCourses?: string[];
  studentDetails?: StudentDetails | null;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";
let refreshInFlight: Promise<boolean> | null = null;

function getAuthHeaders() {
  const token = localStorage.getItem("ujaasToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function runRequest(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });
}

async function tryRefreshToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await runRequest("/api/auth/refresh", { method: "POST" });
        if (!response.ok) {
          localStorage.removeItem("ujaasToken");
          return false;
        }
        const data = await response.json().catch(() => ({}));
        if (data?.token) {
          localStorage.setItem("ujaasToken", data.token);
        }
        return true;
      } catch {
        localStorage.removeItem("ujaasToken");
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

async function request<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const response = await runRequest(path, options);

  if (response.status === 401 && !retried && path !== "/api/auth/refresh" && path !== "/api/auth/login") {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return request<T>(path, options, true);
    }
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const result = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("ujaasToken", result.token);
  return result;
}

export async function signup(name: string, email: string, password: string): Promise<AuthResponse> {
  const result = await request<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  localStorage.setItem("ujaasToken", result.token);
  return result;
}

export async function me(): Promise<{ user: AuthUser }> {
  return request<{ user: AuthUser }>("/api/auth/me");
}

export async function updateMyProfile(payload: UpdateProfilePayload): Promise<{ user: AuthUser }> {
  return request<{ user: AuthUser }>("/api/profile/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function logout(): Promise<void> {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } finally {
    localStorage.removeItem("ujaasToken");
  }
}
