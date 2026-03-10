/**
 * Batch API client — typed functions for batch management.
 * Uses the same auth/request infrastructure as auth.ts.
 */

const API_BASE_URL =
    (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("ujaasToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function runRequest(
    path: string,
    options: RequestInit = {}
): Promise<Response> {
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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await runRequest(path, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error((data as any)?.message || "Request failed");
    }
    return data;
}

// ── Types ──────────────────────────────────────────────

export interface ApiBatchFaculty {
    id: string;
    name: string;
}

export interface ApiBatch {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    subjects: string[] | null;
    faculty: ApiBatchFaculty[];
    student_count: number;
}

export interface CreateBatchPayload {
    name: string;
    year?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    subjects?: string[];
    facultyIds?: string[];
}

export interface UpdateBatchPayload {
    name?: string;
    is_active?: boolean;
    subjects?: string[];
    facultyIds?: string[];
}

// ── API functions ──────────────────────────────────────

export async function fetchBatches(): Promise<ApiBatch[]> {
    return request<ApiBatch[]>("/api/batches");
}

export async function fetchBatch(id: string): Promise<ApiBatch> {
    return request<ApiBatch>(`/api/batches/${id}`);
}

export async function createBatch(
    data: CreateBatchPayload
): Promise<ApiBatch> {
    return request<ApiBatch>("/api/batches", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateBatch(
    id: string,
    data: UpdateBatchPayload
): Promise<ApiBatch> {
    return request<ApiBatch>(`/api/batches/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteBatch(id: string): Promise<void> {
    await request(`/api/batches/${id}`, { method: "DELETE" });
}

export async function assignStudentToBatch(
    batchId: string,
    studentId: string
): Promise<void> {
    await request(`/api/batches/${batchId}/students`, {
        method: "POST",
        body: JSON.stringify({ studentId }),
    });
}

export async function removeStudentFromBatch(
    batchId: string,
    studentId: string
): Promise<void> {
    await request(`/api/batches/${batchId}/students/${studentId}`, {
        method: "DELETE",
    });
}

export async function assignFacultyToBatch(
    batchId: string,
    facultyId: string
): Promise<void> {
    await request(`/api/batches/${batchId}/faculty`, {
        method: "POST",
        body: JSON.stringify({ facultyId }),
    });
}

export async function removeFacultyFromBatch(
    batchId: string,
    facultyId: string
): Promise<void> {
    await request(`/api/batches/${batchId}/faculty/${facultyId}`, {
        method: "DELETE",
    });
}
