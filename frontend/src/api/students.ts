/**
 * Student API client — typed functions for student management.
 */

const API_BASE_URL =
    (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("ujaasToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        credentials: "include",
        cache: "no-store",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
            ...(options.headers || {}),
        },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error((data as any)?.message || "Request failed");
    }
    return data;
}

// ── Types ──────────────────────────────────────────────

export interface ApiStudentBatch {
    id: string;
    name: string;
}

export interface ApiStudent {
    id: string;
    name: string;
    login_id: string;
    roll_number: string;
    phone: string | null;
    address: string | null;
    date_of_birth: string | null;
    parent_contact: string | null;
    join_date: string | null;
    rating_attendance: number;
    rating_assignments: number;
    rating_participation: number;
    rating_behavior: number;
    assigned_batch: ApiStudentBatch | null;
}

export interface CreateStudentPayload {
    name: string;
    rollNumber: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    parentContact?: string;
    batchId?: string;
}

export interface UpdateStudentPayload {
    name?: string;
    rollNumber?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    parentContact?: string;
}

// ── API functions ──────────────────────────────────────

export async function fetchStudents(): Promise<ApiStudent[]> {
    return request<ApiStudent[]>("/api/students");
}

export async function fetchStudent(id: string): Promise<ApiStudent> {
    return request<ApiStudent>(`/api/students/${id}`);
}

export async function createStudent(
    data: CreateStudentPayload
): Promise<ApiStudent> {
    return request<ApiStudent>("/api/students", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateStudent(
    id: string,
    data: UpdateStudentPayload
): Promise<ApiStudent> {
    return request<ApiStudent>(`/api/students/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteStudent(id: string): Promise<void> {
    await request(`/api/students/${id}`, { method: "DELETE" });
}

export async function assignStudentToBatch(
    studentId: string,
    batchId: string
): Promise<ApiStudent> {
    return request<ApiStudent>(`/api/students/${studentId}/batches`, {
        method: "POST",
        body: JSON.stringify({ batchId }),
    });
}

export async function removeStudentFromBatch(
    studentId: string,
    batchId: string
): Promise<void> {
    await request(`/api/students/${studentId}/batches/${batchId}`, {
        method: "DELETE",
    });
}
