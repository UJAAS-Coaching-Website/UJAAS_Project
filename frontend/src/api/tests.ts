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
    status: 'draft' | 'upcoming' | 'live';
    created_by: string | null;
    question_count: number;
    enrolled_count: number;
    submitted_attempt_count?: number;
    has_active_attempt?: boolean;
    active_attempt_id?: string | null;
    latest_attempt_id?: string | null;
    latest_attempt_submitted_at?: string | null;
    latest_attempt_time_spent?: number | null;
    batches: ApiTestBatch[];
    questions?: ApiQuestion[];
}

export interface ApiAttempt {
    id: string;
    test_id: string;
    student_id: string;
    attempt_no: number;
    started_at: string;
    deadline_at: string;
    submitted_at: string | null;
    auto_submitted: boolean;
    time_spent: number;
    score: number | null;
    correct_answers: number;
    wrong_answers: number;
    unattempted: number;
    answers: Record<string, string | number | null>;
}

export interface ApiAttemptHistoryEntry {
    id: string;
    attempt_no: number;
    submitted_at: string;
    auto_submitted: boolean;
    time_spent: number;
    score: number;
    correct_answers: number;
    wrong_answers: number;
    unattempted: number;
    rank: number;
    total_students: number;
}

export interface ApiAttemptSummary {
    testId: string;
    maxAttempts: number;
    submittedAttemptCount: number;
    remainingAttempts: number;
    hasActiveAttempt: boolean;
    activeAttempt: ApiAttempt | null;
    history: ApiAttemptHistoryEntry[];
}

export interface ApiActiveAttemptPayload {
    test: ApiTest;
    attempt: ApiAttempt;
    maxAttempts: number;
    submittedAttemptCount: number;
    serverNow: string;
    resumed: boolean;
}

export interface ApiAttemptResultQuestion extends ApiQuestion {
    user_answer: string | number | null;
}

export interface ApiAttemptResult {
    attempt_id: string;
    attempt_no: number;
    auto_submitted: boolean;
    testId: string;
    testTitle: string;
    totalMarks: number;
    obtainedMarks: number;
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    unattempted: number;
    timeSpent: number;
    duration: number;
    rank: number;
    totalStudents: number;
    submittedAt: string;
    instructions?: string;
    questions: ApiAttemptResultQuestion[];
}

export interface ApiStudentAttemptResultListItem {
    id: string;
    testId: string;
    attemptNo: number;
    testTitle: string;
    submittedAt: string;
    autoSubmitted: boolean;
    timeSpent: number;
    score: number;
    totalMarks: number;
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    unattempted: number;
    rank: number;
    totalStudents: number;
    duration: number;
    percentage: number;
}

export interface ApiTestAnalysisPerformance {
    studentId: string;
    studentName: string;
    attemptCount: number;
    latestSubmittedAt: string;
    score: number;
    totalMarks: number;
    accuracy: number;
    rank: number;
    timeSpent: number;
    attempts: ApiAttemptResult[];
}

export interface ApiTestAnalysis {
    testId: string;
    performances: ApiTestAnalysisPerformance[];
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

export async function updateTestStatus(id: string, status: 'draft' | 'upcoming' | 'live'): Promise<ApiTest> {
    return request<ApiTest>(`/api/tests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

export async function forceTestLiveNow(id: string): Promise<ApiTest> {
    return request<ApiTest>(`/api/tests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'live', forceLiveNow: true }),
    });
}

export async function deleteTestApi(id: string): Promise<void> {
    await request(`/api/tests/${id}`, { method: 'DELETE' });
}

export async function fetchMyAttemptResults(): Promise<ApiStudentAttemptResultListItem[]> {
    return request<ApiStudentAttemptResultListItem[]>('/api/tests/attempts/mine');
}

export async function fetchAttemptResult(attemptId: string): Promise<ApiAttemptResult> {
    return request<ApiAttemptResult>(`/api/tests/attempts/${attemptId}/result`);
}

export async function fetchMyTestAttemptSummary(testId: string): Promise<ApiAttemptSummary> {
    return request<ApiAttemptSummary>(`/api/tests/${testId}/attempts`);
}

export async function startMyTestAttempt(testId: string): Promise<ApiActiveAttemptPayload> {
    return request<ApiActiveAttemptPayload>(`/api/tests/${testId}/attempts/start`, {
        method: 'POST',
    });
}

export async function saveMyAttemptProgress(
    attemptId: string,
    answers: Record<string, string | number | null>
): Promise<ApiAttempt> {
    return request<ApiAttempt>(`/api/tests/attempts/${attemptId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({ answers }),
    });
}

export async function submitMyAttempt(
    attemptId: string,
    answers: Record<string, string | number | null>,
    autoSubmitted = false
): Promise<ApiAttemptResult> {
    return request<ApiAttemptResult>(`/api/tests/attempts/${attemptId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers, autoSubmitted }),
    });
}

export async function fetchTestAnalysis(testId: string): Promise<ApiTestAnalysis> {
    return request<ApiTestAnalysis>(`/api/tests/${testId}/attempts/analysis`);
}
