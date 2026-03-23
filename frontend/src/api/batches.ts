/**
 * Batch API client — typed functions for batch management.
 * Uses the same auth/request infrastructure as auth.ts.
 */

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


function normalizeSubjects(input: unknown): string[] | null {
    if (Array.isArray(input)) {
        return input.map((s) => String(s).trim()).filter(Boolean);
    }
    if (typeof input === "string") {
        const trimmed = input.trim();
        if (!trimmed || trimmed == "{}") return [];
        const body = trimmed.replace(/^{|}$/g, "");
        return body
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (input == null) return null;
    return [String(input).trim()].filter(Boolean);
}

function normalizeBatch(batch: ApiBatch): ApiBatch {
    return {
        ...batch,
        subjects: normalizeSubjects(batch.subjects),
    };
}

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
    timetable_url: string | null;
    faculty: ApiBatchFaculty[];
    student_count: number;
}

export interface CreateBatchPayload {
    name: string;
    year?: string;
    startDate?: string;
    endDate?: string;
    subjects?: string[];
    timetable_url?: string;
    facultyIds?: string[];
}

export interface UpdateBatchPayload {
    name?: string;
    is_active?: boolean;
    subjects?: string[];
    timetable_url?: string;
    facultyIds?: string[];
}

export interface PermanentDeleteBatchSummary {
    deletedBatchId: string;
    removedStudentLinks: number;
    removedFacultyLinks: number;
    deletedChapters: number;
    deletedNotes: number;
    deletedDpps: number;
    deletedDppAttempts: number;
    deletedExclusiveTests: number;
    unlinkedSharedTests: number;
    deletedNotifications: number;
    removedTimetableReference: number;
}

let batchesCache: ApiBatch[] | null = null;
export const getBatchesCache = () => batchesCache;
export const setBatchesCache = (data: ApiBatch[] | null) => { batchesCache = data; };

// ── API functions ──────────────────────────────────────

export async function fetchBatches(forceRefresh = false): Promise<ApiBatch[]> {
    if (batchesCache && !forceRefresh) return batchesCache;
    const batches = await request<ApiBatch[]>("/api/batches");
    batchesCache = batches.map(normalizeBatch);
    return batchesCache;
}

export async function fetchBatch(id: string): Promise<ApiBatch> {
    const batch = await request<ApiBatch>(`/api/batches/${id}`);
    return normalizeBatch(batch);
}

export async function createBatch(
    data: CreateBatchPayload
): Promise<ApiBatch> {
    return request<ApiBatch>("/api/batches", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function uploadBatchTimetable(
    batchId: string,
    file: File
): Promise<ApiBatch> {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/api/batches/${batchId}/timetable`, {
        method: "POST",
        body: formData,
        credentials: "include",
        cache: "no-store",
        headers: {
            ...getAuthHeaders(),
        },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error((data as any)?.message || "Failed to upload timetable");
    }
    return data;
}

export async function deleteBatchTimetable(
    batchId: string
): Promise<ApiBatch> {
    return request<ApiBatch>(`/api/batches/${batchId}/timetable`, {
        method: "DELETE",
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

export async function permanentlyDeleteBatch(
    id: string
): Promise<{ message: string; summary: PermanentDeleteBatchSummary }> {
    return request(`/api/batches/${id}/permanent`, { method: "DELETE" });
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

export async function createBatchNotification(
    batchId: string,
    data: { title: string; message: string; type?: string }
): Promise<void> {
    await request(`/api/batches/${batchId}/notifications`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}
import { API_BASE_URL } from "./base";
