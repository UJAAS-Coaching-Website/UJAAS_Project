const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";
let refreshInFlight: Promise<boolean> | null = null;

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("ujaasToken");
    if (!token || token === "null" || token === "undefined") {
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
                if ((data as any)?.token) {
                    localStorage.setItem("ujaasToken", (data as any).token);
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
        throw new Error((data as any)?.message || "Request failed");
    }
    return data;
}

export interface ApiDppQuestion {
    id: string;
    subject: string;
    section: string | null;
    type: "MCQ" | "MSQ" | "Numerical";
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

export interface ApiDpp {
    id: string;
    title: string;
    instructions: string | null;
    chapter_id: string;
    chapter_name: string;
    subject_name: string;
    batch_id: string;
    batch_name: string;
    question_count: number;
    created_by: string | null;
    created_at: string;
    submitted_attempt_count?: number;
    max_attempts?: number;
    questions?: ApiDppQuestion[];
}

export interface ApiDppAttemptHistoryEntry {
    id: string;
    attempt_no: number;
    submitted_at: string;
    score: number;
    correct_answers: number;
    wrong_answers: number;
    unattempted: number;
}

export interface ApiDppAttemptSummary {
    dppId: string;
    maxAttempts: number;
    submittedAttemptCount: number;
    remainingAttempts: number;
    history: ApiDppAttemptHistoryEntry[];
}

export interface ApiStartDppAttemptPayload {
    dpp: ApiDpp;
    maxAttempts: number;
    submittedAttemptCount: number;
    remainingAttempts: number;
    history: ApiDppAttemptHistoryEntry[];
}

export interface ApiDppAttemptResultQuestion extends ApiDppQuestion {
    user_answer: string | number | number[] | null;
}

export interface ApiDppAttemptResult {
    attempt_id: string;
    attempt_no: number;
    dppId: string;
    dppTitle: string;
    chapter_id: string;
    chapter_name: string;
    subject_name: string;
    batch_name: string;
    instructions?: string;
    totalMarks: number;
    obtainedMarks: number;
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    unattempted: number;
    submittedAt: string;
    questions: ApiDppAttemptResultQuestion[];
}

export interface CreateDppPayload {
    title: string;
    instructions?: string;
    chapter_id: string;
    questions: any[];
}

export async function fetchDpps(chapterId?: string): Promise<ApiDpp[]> {
    const query = chapterId ? `?chapter_id=${encodeURIComponent(chapterId)}` : "";
    return request<ApiDpp[]>(`/api/dpps${query}`);
}

export async function fetchDppById(id: string): Promise<ApiDpp> {
    return request<ApiDpp>(`/api/dpps/${id}`);
}

export async function fetchMyDppAttemptSummary(id: string): Promise<ApiDppAttemptSummary> {
    return request<ApiDppAttemptSummary>(`/api/dpps/${id}/attempts`);
}

export async function startMyDppAttempt(id: string): Promise<ApiStartDppAttemptPayload> {
    return request<ApiStartDppAttemptPayload>(`/api/dpps/${id}/attempts/start`, {
        method: "POST",
    });
}

export async function submitMyDppAttempt(id: string, answers: Record<string, string | number | number[] | null>): Promise<ApiDppAttemptResult> {
    return request<ApiDppAttemptResult>(`/api/dpps/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers }),
    });
}

export async function fetchDppAttemptResult(attemptId: string): Promise<ApiDppAttemptResult> {
    return request<ApiDppAttemptResult>(`/api/dpps/attempts/${attemptId}/result`);
}

export async function createDpp(payload: CreateDppPayload): Promise<ApiDpp> {
    return request<ApiDpp>("/api/dpps", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateDpp(id: string, payload: Partial<CreateDppPayload>): Promise<ApiDpp> {
    return request<ApiDpp>(`/api/dpps/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function deleteDpp(id: string): Promise<void> {
    await request(`/api/dpps/${id}`, {
        method: "DELETE",
    });
}
