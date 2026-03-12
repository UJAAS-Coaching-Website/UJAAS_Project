/**
 * Chapter API client
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

export interface ApiChapter {
    id: string;
    batch_id: string;
    subject_name: string;
    name: string;
    order_index: number;
    created_at: string;
}

export interface CreateChapterPayload {
    batch_id: string;
    subject_name: string;
    name: string;
    order_index?: number;
}

export async function apiFetchChapters(batch_id?: string, subject_name?: string): Promise<ApiChapter[]> {
    const params = new URLSearchParams();
    if (batch_id) params.append("batch_id", batch_id);
    if (subject_name) params.append("subject_name", subject_name);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return request<ApiChapter[]>(`/api/chapters${queryString}`);
}

export async function apiCreateChapter(payload: CreateChapterPayload): Promise<ApiChapter> {
    return request<ApiChapter>("/api/chapters", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function apiUpdateChapter(id: string, updates: Partial<CreateChapterPayload>): Promise<ApiChapter> {
    return request<ApiChapter>(`/api/chapters/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
    });
}

export async function apiDeleteChapter(id: string): Promise<void> {
    return request<void>(`/api/chapters/${id}`, {
        method: "DELETE",
    });
}
