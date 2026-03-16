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
    testPerformance?: number;
    participation: number;
    behavior: number;
    engagement: number;
    dppPerformance?: number;
  };
}

export interface SubjectRating {
  attendance: number;
  total_classes?: number;
  attendanceRating?: number;
  tests: number;
  dppPerformance: number;
  behavior: number;
  remarks?: string;
}

export interface FacultyDetails {
  phone: string;
  subjectSpecialty: string;
  designation?: string;
  joinDate: string | null;
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
  loginId?: string | null;
  role: "student" | "faculty" | "admin";
  enrolledCourses?: string[];
  studentDetails?: StudentDetails | null;
  subjectRatings?: Record<string, SubjectRating>;
  subjectRemarks?: Record<string, string>;
  facultyDetails?: FacultyDetails | null;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";
let refreshInFlight: Promise<boolean> | null = null;

function isLikelyJwt(token: string | null): token is string {
  if (!token || token === "null" || token === "undefined") {
    return false;
  }
  return token.split(".").length === 3;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("ujaasToken");
  if (!isLikelyJwt(token)) {
    if (token) {
      localStorage.removeItem("ujaasToken");
    }
    return {};
  }
  return { Authorization: `Bearer ${token}` };
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

export async function login(loginId: string, password: string): Promise<AuthResponse> {
  const result = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ loginId, password }),
  });
  localStorage.setItem("ujaasToken", result.token);
  return result;
}

export async function me(): Promise<{ user: AuthUser }> {
  const token = localStorage.getItem("ujaasToken");
  if (!isLikelyJwt(token)) {
    if (token) {
      localStorage.removeItem("ujaasToken");
    }
    throw new Error("No auth token");
  }
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
