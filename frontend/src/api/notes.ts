/**
 * Note API client
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

async function runFormRequest(path: string, options: RequestInit = {}): Promise<Response> {
    return fetch(`${API_BASE_URL}${path}`, {
        ...options,
        credentials: "include",
        cache: "no-store",
        headers: {
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

export interface ApiNote {
    id: string;
    chapter_id: string;
    title: string;
    file_url: string;
    created_at: string;
}

export interface CreateNotePayload {
    chapter_id: string;
    title: string;
    file_url: string;
}

export async function apiFetchNotes(chapter_id: string): Promise<ApiNote[]> {
    return request<ApiNote[]>(`/api/notes?chapter_id=${chapter_id}`);
}

export async function apiCreateNote(payload: CreateNotePayload): Promise<ApiNote> {
    return request<ApiNote>("/api/notes", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function apiUploadNote(formData: FormData): Promise<ApiNote> {
    const response = await runFormRequest("/api/notes/upload", {
        method: "POST",
        body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error((data as any)?.message || "Upload failed");
    }
    return data as ApiNote;
}

export async function apiUpdateNote(id: string, updates: Partial<CreateNotePayload>): Promise<ApiNote> {
    return request<ApiNote>(`/api/notes/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
    });
}

export async function apiDeleteNote(id: string): Promise<void> {
    return request<void>(`/api/notes/${id}`, {
        method: "DELETE",
    });
}
import { API_BASE_URL } from "./base";
