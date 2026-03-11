const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

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

export interface ApiFaculty {
    id: string;
    name: string;
    email: string;
    subject: string;
    designation?: string;
    experience?: string;
    bio?: string;
    phone?: string;
    rating?: number;
}

export async function fetchFaculties(): Promise<ApiFaculty[]> {
    return request<ApiFaculty[]>('/api/faculties');
}

export interface CreateFacultyPayload {
    name: string;
    email: string;
    subject?: string;
    phone?: string;
    designation?: string;
    experience?: string;
}

export async function createFaculty(data: CreateFacultyPayload): Promise<ApiFaculty> {
    return request<ApiFaculty>('/api/faculties', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateFaculty(id: string, data: Partial<CreateFacultyPayload>): Promise<ApiFaculty> {
    return request<ApiFaculty>(`/api/faculties/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteFacultyApi(id: string): Promise<void> {
    await request(`/api/faculties/${id}`, { method: 'DELETE' });
}
