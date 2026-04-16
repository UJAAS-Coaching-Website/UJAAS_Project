import { API_BASE_URL } from "./base";
import { getDeviceId } from "../utils/deviceId";

let refreshInFlight: Promise<boolean> | null = null;

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("ujaasToken");
    if (!token || token === "null" || token === "undefined") {
        return {};
    }
    return { Authorization: `Bearer ${token}` };
}

function getDeviceHeaders(): Record<string, string> {
    return { "X-Device-Id": getDeviceId() };
}

async function runRequest(path: string, options: RequestInit = {}): Promise<Response> {
    return fetch(`${API_BASE_URL}${path}`, {
        ...options,
        credentials: "include",
        cache: "no-store",
        headers: {
            "Content-Type": "application/json",
            ...getDeviceHeaders(),
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
    type: 'MCQ' | 'MSQ' | 'Numerical';
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
    answers: Record<string, string | number | number[] | null>;
}

export interface ApiAttemptUiState {
    flaggedQuestionIds: string[];
    visitedQuestionIds: string[];
    currentQuestionIndex: number;
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
    user_answer: string | number | number[] | null;
}

export interface ApiQuestionExplanation {
    explanation: string | null;
    explanation_img: string | null;
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

export interface ApiAttemptSubjectStat {
    subject: string;
    scoredMarks: number;
    totalMarks: number;
    correct: number;
    incorrect: number;
    unattempted: number;
}

export interface ApiAttemptSummaryResult {
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
    subjectStats: ApiAttemptSubjectStat[];
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
    firstSubmittedAt?: string;
    score: number;
    totalMarks: number;
    accuracy: number;
    rank: number;
    timeSpent: number;
}

export interface ApiTestAnalysis {
    testId: string;
    performances: ApiTestAnalysisPerformance[];
}

export interface ApiTestStudentAnalysis {
    testId: string;
    studentId: string;
    studentName: string;
    attempts: ApiAttemptSummaryResult[];
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
    partialQuestions?: boolean;
}

let testsCache: ApiTest[] | null = null;
export const getTestsCache = () => testsCache;
export const setTestsCache = (data: ApiTest[] | null) => { testsCache = data; };

type AnalysisCacheOptions = {
    forceRefresh?: boolean;
    expectedTestId?: string;
    signal?: AbortSignal;
};

let testAnalysisCacheOwner: string | null = null;
const attemptSummaryResultCache = new Map<string, ApiAttemptSummaryResult>();
const attemptSummaryResultInFlight = new Map<string, Promise<ApiAttemptSummaryResult>>();
const attemptResultCache = new Map<string, ApiAttemptResult>();
const attemptResultInFlight = new Map<string, Promise<ApiAttemptResult>>();
const testAttemptSummaryCache = new Map<string, ApiAttemptSummary>();
const testAttemptSummaryInFlight = new Map<string, Promise<ApiAttemptSummary>>();
const myAttemptResultsCache = new Map<string, ApiStudentAttemptResultListItem[]>();
const myAttemptResultsInFlight = new Map<string, Promise<ApiStudentAttemptResultListItem[]>>();
const testAnalysisTableCache = new Map<string, ApiTestAnalysis>();
const testAnalysisTableInFlight = new Map<string, Promise<ApiTestAnalysis>>();
const testAnalysisDetailCache = new Map<string, ApiTestStudentAnalysis>();
const testAnalysisDetailInFlight = new Map<string, Promise<ApiTestStudentAnalysis>>();

const hasAnalysisCacheOwner = () => Boolean(testAnalysisCacheOwner);
const analysisCacheKey = (id: string) => `${testAnalysisCacheOwner}:${id}`;

const hasExpectedTest = (
    value: { testId: string } | undefined,
    expectedTestId?: string
) => Boolean(value && (!expectedTestId || value.testId === expectedTestId));

export function clearTestAnalysisCache() {
    attemptSummaryResultCache.clear();
    attemptSummaryResultInFlight.clear();
    attemptResultCache.clear();
    attemptResultInFlight.clear();
    testAttemptSummaryCache.clear();
    testAttemptSummaryInFlight.clear();
    myAttemptResultsCache.clear();
    myAttemptResultsInFlight.clear();
    testAnalysisTableCache.clear();
    testAnalysisTableInFlight.clear();
    testAnalysisDetailCache.clear();
    testAnalysisDetailInFlight.clear();
}

export function setTestAnalysisCacheOwner(userId: string | null) {
    if (testAnalysisCacheOwner !== userId) {
        clearTestAnalysisCache();
        testAnalysisCacheOwner = userId;
    }
}

export function getCachedAttemptSummaryResult(
    attemptId: string,
    options: AnalysisCacheOptions = {}
): ApiAttemptSummaryResult | null {
    if (!hasAnalysisCacheOwner()) return null;
    const cacheKey = analysisCacheKey(attemptId);
    const cached = attemptSummaryResultCache.get(cacheKey);
    if (!hasExpectedTest(cached, options.expectedTestId)) {
        if (cached) attemptSummaryResultCache.delete(cacheKey);
        return null;
    }
    return cached || null;
}

export function clearAttemptAnalysisCache(attemptId: string) {
    if (!hasAnalysisCacheOwner()) return;
    const cacheKey = analysisCacheKey(attemptId);
    attemptSummaryResultCache.delete(cacheKey);
    attemptSummaryResultInFlight.delete(cacheKey);
    attemptResultCache.delete(cacheKey);
    attemptResultInFlight.delete(cacheKey);
}

export function clearTestAttemptCaches(testId?: string) {
    if (!hasAnalysisCacheOwner()) return;
    myAttemptResultsCache.delete(testAnalysisCacheOwner as string);
    myAttemptResultsInFlight.delete(testAnalysisCacheOwner as string);

    if (testId) {
        const cacheKey = analysisCacheKey(testId);
        testAttemptSummaryCache.delete(cacheKey);
        testAttemptSummaryInFlight.delete(cacheKey);
        return;
    }

    testAttemptSummaryCache.clear();
    testAttemptSummaryInFlight.clear();
}

export function clearCachedTestInsights(testId?: string) {
    if (!hasAnalysisCacheOwner()) return;

    if (!testId) {
        testAnalysisTableCache.clear();
        testAnalysisTableInFlight.clear();
        testAnalysisDetailCache.clear();
        testAnalysisDetailInFlight.clear();
        return;
    }

    const tablePrefix = analysisCacheKey(`table:${testId}:`);
    const detailPrefix = analysisCacheKey(`detail:${testId}:`);

    Array.from(testAnalysisTableCache.keys()).forEach((key) => {
        if (key.startsWith(tablePrefix)) testAnalysisTableCache.delete(key);
    });
    Array.from(testAnalysisTableInFlight.keys()).forEach((key) => {
        if (key.startsWith(tablePrefix)) testAnalysisTableInFlight.delete(key);
    });
    Array.from(testAnalysisDetailCache.keys()).forEach((key) => {
        if (key.startsWith(detailPrefix)) testAnalysisDetailCache.delete(key);
    });
    Array.from(testAnalysisDetailInFlight.keys()).forEach((key) => {
        if (key.startsWith(detailPrefix)) testAnalysisDetailInFlight.delete(key);
    });
}

export function seedAttemptResultCache(result: ApiAttemptResult) {
    if (!hasAnalysisCacheOwner()) return;
    attemptResultCache.set(analysisCacheKey(result.attempt_id), result);
}

// ── API Functions ──────────────────────────────────

export async function fetchTests(forceRefresh = false): Promise<ApiTest[]> {
    if (testsCache && !forceRefresh) return testsCache;
    testsCache = await request<ApiTest[]>('/api/tests');
    return testsCache;
}

export async function fetchTestById(id: string): Promise<ApiTest> {
    return request<ApiTest>(`/api/tests/${id}`);
}

export async function createTest(data: CreateTestPayload): Promise<ApiTest> {
    const created = await request<ApiTest>('/api/tests', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    testsCache = null;
    clearTestAnalysisCache();
    return created;
}

export async function updateTestApi(id: string, data: Partial<CreateTestPayload>): Promise<ApiTest> {
    const updated = await request<ApiTest>(`/api/tests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    testsCache = null;
    clearTestAnalysisCache();
    return updated;
}

export async function updateTestStatus(id: string, status: 'draft' | 'upcoming' | 'live'): Promise<ApiTest> {
    const updated = await request<ApiTest>(`/api/tests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
    testsCache = null;
    clearTestAnalysisCache();
    return updated;
}

export async function forceTestLiveNow(id: string): Promise<ApiTest> {
    const updated = await request<ApiTest>(`/api/tests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'live', forceLiveNow: true }),
    });
    testsCache = null;
    clearTestAnalysisCache();
    return updated;
}

export async function deleteTestApi(id: string): Promise<void> {
    await request(`/api/tests/${id}`, { method: 'DELETE' });
    testsCache = null;
    clearTestAnalysisCache();
}

export async function fetchMyAttemptResults(options: AnalysisCacheOptions = {}): Promise<ApiStudentAttemptResultListItem[]> {
    if (!hasAnalysisCacheOwner()) {
        return request<ApiStudentAttemptResultListItem[]>('/api/tests/attempts/mine');
    }

    const cacheKey = testAnalysisCacheOwner as string;
    if (!options.forceRefresh && myAttemptResultsCache.has(cacheKey)) {
        return myAttemptResultsCache.get(cacheKey) as ApiStudentAttemptResultListItem[];
    }

    if (!options.forceRefresh && myAttemptResultsInFlight.has(cacheKey)) {
        return myAttemptResultsInFlight.get(cacheKey) as Promise<ApiStudentAttemptResultListItem[]>;
    }

    const pending = request<ApiStudentAttemptResultListItem[]>('/api/tests/attempts/mine')
        .then((results) => {
            myAttemptResultsCache.set(cacheKey, results);
            return results;
        })
        .finally(() => {
            myAttemptResultsInFlight.delete(cacheKey);
        });
    myAttemptResultsInFlight.set(cacheKey, pending);
    return pending;
}

export async function fetchAttemptResult(attemptId: string, options: AnalysisCacheOptions = {}): Promise<ApiAttemptResult> {
    if (!hasAnalysisCacheOwner()) {
        return request<ApiAttemptResult>(`/api/tests/attempts/${attemptId}/result`, { signal: options.signal });
    }

    const cacheKey = analysisCacheKey(attemptId);
    const cached = attemptResultCache.get(cacheKey);
    if (!options.forceRefresh && hasExpectedTest(cached, options.expectedTestId)) {
        return cached as ApiAttemptResult;
    }
    if (cached && !hasExpectedTest(cached, options.expectedTestId)) {
        attemptResultCache.delete(cacheKey);
    }

    if (options.signal) {
        const result = await request<ApiAttemptResult>(`/api/tests/attempts/${attemptId}/result`, { signal: options.signal });
        if (!hasExpectedTest(result, options.expectedTestId)) {
            throw new Error('Attempt result belongs to a different test');
        }
        attemptResultCache.set(cacheKey, result);
        return result;
    }

    if (!options.forceRefresh && attemptResultInFlight.has(cacheKey)) {
        return (attemptResultInFlight.get(cacheKey) as Promise<ApiAttemptResult>).then((result) => {
            if (!hasExpectedTest(result, options.expectedTestId)) {
                throw new Error('Attempt result belongs to a different test');
            }
            return result;
        });
    }

    const pending = request<ApiAttemptResult>(`/api/tests/attempts/${attemptId}/result`)
        .then((result) => {
            if (!hasExpectedTest(result, options.expectedTestId)) {
                throw new Error('Attempt result belongs to a different test');
            }
            attemptResultCache.set(cacheKey, result);
            return result;
        })
        .finally(() => {
            attemptResultInFlight.delete(cacheKey);
        });
    attemptResultInFlight.set(cacheKey, pending);
    return pending;
}

export async function fetchAttemptSummaryResult(attemptId: string, options: AnalysisCacheOptions = {}): Promise<ApiAttemptSummaryResult> {
    if (!hasAnalysisCacheOwner()) {
        return request<ApiAttemptSummaryResult>(`/api/tests/attempts/${attemptId}/summary`);
    }

    const cacheKey = analysisCacheKey(attemptId);
    const cached = attemptSummaryResultCache.get(cacheKey);
    if (!options.forceRefresh && hasExpectedTest(cached, options.expectedTestId)) {
        return cached as ApiAttemptSummaryResult;
    }
    if (cached && !hasExpectedTest(cached, options.expectedTestId)) {
        attemptSummaryResultCache.delete(cacheKey);
    }

    if (!options.forceRefresh && attemptSummaryResultInFlight.has(cacheKey)) {
        return (attemptSummaryResultInFlight.get(cacheKey) as Promise<ApiAttemptSummaryResult>).then((result) => {
            if (!hasExpectedTest(result, options.expectedTestId)) {
                throw new Error('Attempt summary belongs to a different test');
            }
            return result;
        });
    }

    const pending = request<ApiAttemptSummaryResult>(`/api/tests/attempts/${attemptId}/summary`)
        .then((result) => {
            if (!hasExpectedTest(result, options.expectedTestId)) {
                throw new Error('Attempt summary belongs to a different test');
            }
            attemptSummaryResultCache.set(cacheKey, result);
            return result;
        })
        .finally(() => {
            attemptSummaryResultInFlight.delete(cacheKey);
        });
    attemptSummaryResultInFlight.set(cacheKey, pending);
    return pending;
}

export async function fetchAttemptQuestionExplanation(
    attemptId: string,
    questionId: string
): Promise<ApiQuestionExplanation> {
    return request<ApiQuestionExplanation>(`/api/tests/attempts/${attemptId}/questions/${questionId}/explanation`);
}

export async function fetchMyTestAttemptSummary(testId: string, options: AnalysisCacheOptions = {}): Promise<ApiAttemptSummary> {
    if (!hasAnalysisCacheOwner()) {
        return request<ApiAttemptSummary>(`/api/tests/${testId}/attempts`);
    }

    const cacheKey = analysisCacheKey(testId);
    if (!options.forceRefresh && testAttemptSummaryCache.has(cacheKey)) {
        return testAttemptSummaryCache.get(cacheKey) as ApiAttemptSummary;
    }

    if (!options.forceRefresh && testAttemptSummaryInFlight.has(cacheKey)) {
        return testAttemptSummaryInFlight.get(cacheKey) as Promise<ApiAttemptSummary>;
    }

    const pending = request<ApiAttemptSummary>(`/api/tests/${testId}/attempts`)
        .then((summary) => {
            testAttemptSummaryCache.set(cacheKey, summary);
            return summary;
        })
        .finally(() => {
            testAttemptSummaryInFlight.delete(cacheKey);
        });
    testAttemptSummaryInFlight.set(cacheKey, pending);
    return pending;
}

export async function startMyTestAttempt(testId: string): Promise<ApiActiveAttemptPayload> {
    const payload = await request<ApiActiveAttemptPayload>(`/api/tests/${testId}/attempts/start`, {
        method: 'POST',
    });
    clearTestAttemptCaches(testId);
    return payload;
}

export async function saveMyAttemptProgress(
    attemptId: string,
    answers: Record<string, string | number | number[] | null>,
    uiState?: ApiAttemptUiState
): Promise<ApiAttempt> {
    return request<ApiAttempt>(`/api/tests/attempts/${attemptId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({ answers, uiState }),
    });
}

export async function submitMyAttempt(
    attemptId: string,
    answers: Record<string, string | number | number[] | null>,
    autoSubmitted = false
): Promise<ApiAttemptResult> {
    const result = await request<ApiAttemptResult>(`/api/tests/attempts/${attemptId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers, autoSubmitted }),
    });
    clearAttemptAnalysisCache(attemptId);
    clearTestAttemptCaches(result.testId);
    seedAttemptResultCache(result);
    return result;
}

export async function fetchTestAnalysis(testId: string, search?: string, options: AnalysisCacheOptions = {}): Promise<ApiTestAnalysis> {
    const normalizedSearch = search?.trim().toLowerCase() || '';
    const query = normalizedSearch
        ? `?search=${encodeURIComponent(normalizedSearch)}`
        : "";

    if (!hasAnalysisCacheOwner()) {
        return request<ApiTestAnalysis>(`/api/tests/${testId}/attempts/analysis${query}`, { signal: options.signal });
    }

    const cacheKey = analysisCacheKey(`table:${testId}:${normalizedSearch || 'all'}`);
    if (!options.forceRefresh && testAnalysisTableCache.has(cacheKey)) {
        return testAnalysisTableCache.get(cacheKey) as ApiTestAnalysis;
    }

    if (options.signal) {
        const analysis = await request<ApiTestAnalysis>(`/api/tests/${testId}/attempts/analysis${query}`, { signal: options.signal });
        testAnalysisTableCache.set(cacheKey, analysis);
        return analysis;
    }

    if (!options.forceRefresh && testAnalysisTableInFlight.has(cacheKey)) {
        return testAnalysisTableInFlight.get(cacheKey) as Promise<ApiTestAnalysis>;
    }

    const pending = request<ApiTestAnalysis>(`/api/tests/${testId}/attempts/analysis${query}`)
        .then((analysis) => {
            testAnalysisTableCache.set(cacheKey, analysis);
            return analysis;
        })
        .finally(() => {
            testAnalysisTableInFlight.delete(cacheKey);
        });
    testAnalysisTableInFlight.set(cacheKey, pending);
    return pending;
}

export async function fetchTestStudentAnalysis(testId: string, studentId: string, options: AnalysisCacheOptions = {}): Promise<ApiTestStudentAnalysis> {
    if (!hasAnalysisCacheOwner()) {
        return request<ApiTestStudentAnalysis>(`/api/tests/${testId}/attempts/analysis/${studentId}`, { signal: options.signal });
    }

    const cacheKey = analysisCacheKey(`detail:${testId}:${studentId}`);
    if (!options.forceRefresh && testAnalysisDetailCache.has(cacheKey)) {
        return testAnalysisDetailCache.get(cacheKey) as ApiTestStudentAnalysis;
    }

    if (options.signal) {
        const analysis = await request<ApiTestStudentAnalysis>(`/api/tests/${testId}/attempts/analysis/${studentId}`, { signal: options.signal });
        testAnalysisDetailCache.set(cacheKey, analysis);
        return analysis;
    }

    if (!options.forceRefresh && testAnalysisDetailInFlight.has(cacheKey)) {
        return testAnalysisDetailInFlight.get(cacheKey) as Promise<ApiTestStudentAnalysis>;
    }

    const pending = request<ApiTestStudentAnalysis>(`/api/tests/${testId}/attempts/analysis/${studentId}`)
        .then((analysis) => {
            testAnalysisDetailCache.set(cacheKey, analysis);
            return analysis;
        })
        .finally(() => {
            testAnalysisDetailInFlight.delete(cacheKey);
        });
    testAnalysisDetailInFlight.set(cacheKey, pending);
    return pending;
}
