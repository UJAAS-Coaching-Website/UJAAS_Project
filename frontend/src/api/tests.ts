const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

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

// ── Types ──────────────────────────────────────────

export interface ApiTestBatch {
    id: string;
    name: string;
}

export interface ApiQuestion {
    id: string;
    subject: string;
    section: string | null;
    type: 'MCQ' | 'Numerical';
    question_text: string;
    question_img: string | null;
    options: string[] | null;
    option_imgs: string[] | null;
    correct_answer: string;
    marks: number;
    neg_marks: number;
    explanation: string | null;
    explanation_img: string | null;
    order_index: number;
    difficulty: string | null;
}

export interface ApiTest {
    id: string;
    title: string;
    format: string | null;
    duration_minutes: number;
    total_marks: number;
    schedule_date: string | null;
    schedule_time: string | null;
    instructions: string | null;
    status: 'draft' | 'upcoming' | 'live' | 'completed';
    created_by: string | null;
    question_count: number;
    enrolled_count: number;
    batches: ApiTestBatch[];
    questions?: ApiQuestion[];
}

export interface CreateTestPayload {
    title: string;
    format: string;
    durationMinutes: number;
    totalMarks: number;
    scheduleDate: string;
    scheduleTime: string;
    instructions?: string;
    batchIds: string[];
    questions: any[];
    status?: 'draft' | 'upcoming';
}

// ── API Functions ──────────────────────────────────

export async function fetchTests(): Promise<ApiTest[]> {
    return request<ApiTest[]>('/api/tests');
}

export async function fetchTestById(id: string): Promise<ApiTest> {
    return request<ApiTest>(`/api/tests/${id}`);
}

export async function createTest(data: CreateTestPayload): Promise<ApiTest> {
    return request<ApiTest>('/api/tests', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateTestApi(id: string, data: Partial<CreateTestPayload>): Promise<ApiTest> {
    return request<ApiTest>(`/api/tests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function updateTestStatus(id: string, status: 'draft' | 'upcoming' | 'live' | 'completed'): Promise<ApiTest> {
    return request<ApiTest>(`/api/tests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

export async function deleteTestApi(id: string): Promise<void> {
    await request(`/api/tests/${id}`, { method: 'DELETE' });
}
