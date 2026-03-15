export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

export function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("ujaasToken");
    if (token) return { Authorization: `Bearer ${token}` };
    return {};
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
    };
    if (options.headers) {
        const extra = options.headers as Record<string, string>;
        Object.assign(headers, extra);
    }
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        credentials: "include",
        headers,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data?.message || "Request failed");
    }
    return data;
}

// ── Landing Page Data ──────────────────────────────────

export interface LandingDataPayload {
    courses: string[];
    faculty: { name: string; subject: string; designation: string; experience: string; image: string }[];
    achievers: { name: string; achievement: string; year: string; image: string }[];
    visions: { id: string; name: string; designation: string; vision: string; image: string }[];
    contact: { phone: string; email: string; address: string };
}

export async function fetchLandingData(): Promise<LandingDataPayload> {
    return apiRequest<LandingDataPayload>("/api/landing");
}

export async function updateLandingData(data: LandingDataPayload): Promise<LandingDataPayload> {
    return apiRequest<LandingDataPayload>("/api/landing", {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function uploadLandingImage(file: File, itemRole: "faculty" | "achiever" | "vision" | "course"): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("context", "landing");
    formData.append("itemRole", itemRole);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data?.message || "Image upload failed");
    }
    return data.imageUrl;
}

export async function deleteLandingImage(imageUrl: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ imageUrl }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data?.message || "Image deletion failed");
    }
}

// ── Prospect Queries ───────────────────────────────────

export interface QueryItem {
    id: string;
    name: string;
    email: string;
    phone: string;
    course: string;
    message?: string;
    date: string;
    status: "new" | "contacted" | "completed";
}

export async function fetchQueries(): Promise<{ queries: QueryItem[] }> {
    return apiRequest<{ queries: QueryItem[] }>("/api/queries");
}

export async function submitQuery(data: {
    name: string;
    email: string;
    phone: string;
    course: string;
    message?: string;
}): Promise<QueryItem> {
    return apiRequest<QueryItem>("/api/queries", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateQueryStatus(
    id: string,
    status: "new" | "contacted" | "completed"
): Promise<{ id: string; status: string }> {
    return apiRequest<{ id: string; status: string }>(`/api/queries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}
