import { API_BASE_URL } from "./base";

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

export interface LandingCourse {
    id: string;
    name: string;
}

export interface LandingDataPayload {
    courses: LandingCourse[];
    faculty: { name: string; subject: string; designation: string; experience: string; image: string }[];
    achievers: { name: string; achievement: string; year: string; image: string }[];
    visions: { id: string; name: string; designation: string; vision: string; image: string }[];
    contact: { phone: string; email: string; address: string };
}

export async function fetchLandingData(): Promise<LandingDataPayload> {
    return apiRequest<LandingDataPayload>("/api/landing", { cache: "no-store" });
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
    courseId?: string;
    message?: string;
    date: string;
    status: "new" | "seen" | "contacted";
}

let queriesCache: QueryItem[] | null = null;
export const getQueriesCache = () => queriesCache;
export const setQueriesCache = (data: QueryItem[] | null) => { queriesCache = data; };

export async function fetchQueries(forceRefresh = false): Promise<{ queries: QueryItem[] }> {
    if (queriesCache && !forceRefresh) return { queries: queriesCache };
    const res = await apiRequest<{ queries: QueryItem[] }>("/api/queries");
    queriesCache = res.queries;
    return res;
}

export async function submitQuery(data: {
    name: string;
    email: string;
    phone: string;
    courseId: string;
    message?: string;
}): Promise<QueryItem> {
    return apiRequest<QueryItem>("/api/queries", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateQueryStatus(
    id: string,
    status: "new" | "seen" | "contacted"
): Promise<{ id: string; status: string }> {
    return apiRequest<{ id: string; status: string }>(`/api/queries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}

export async function deleteQuery(id: string): Promise<void> {
    await apiRequest<{ message: string; id: string }>(`/api/queries/${id}`, {
        method: "DELETE",
    });
}
