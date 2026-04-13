/**
 * Student API client — typed functions for student management.
 */
import { request } from "./auth";

// ── Types ──────────────────────────────────────────────

export interface ApiStudentBatch {
    id: string;
    name: string;
}

export interface ApiStudent {
    id: string;
    name: string;
    login_id: string;
    avatar_url?: string | null;
    avatarUrl?: string | null;
    roll_number: string;
    email?: string | null;
    phone: string | null;
    address: string | null;
    date_of_birth: string | null;
    parent_contact: string | null;
    join_date: string | null;
    rating_attendance: number;
    rating_total_classes: number;
    rating_assignments: number;
    rating_participation: number;
    rating_behavior: number;
    assigned_batch: ApiStudentBatch | null;
    subject_ratings?: Record<string, any>;
    subject_remarks?: Record<string, string>;
    admin_remark?: string;
}

export interface StudentsPageResponse {
    students: ApiStudent[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface FetchStudentsOptions {
    search?: string;
    forceRefresh?: boolean;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
    batch?: string;
}

export interface CreateStudentPayload {
    name: string;
    rollNumber: string;
    email?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    parentContact?: string;
    batchId?: string;
}

export interface UpdateStudentPayload {
    name?: string;
    rollNumber?: string;
    email?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    parentContact?: string;
    adminRemark?: string;
}

export interface UpdateStudentRatingPayload {
    subject: string;
    attendance?: number;
    total_classes?: number;
    tests?: number;
    dppPerformance?: number;
    behavior?: number;
    remarks?: string;
}

let studentsCache: StudentsPageResponse | null = null;
export const getStudentsCache = () => studentsCache;
export const setStudentsCache = (data: StudentsPageResponse | null) => { studentsCache = data; };

// ── API functions ──────────────────────────────────────

export async function fetchStudents(options: FetchStudentsOptions = {}): Promise<StudentsPageResponse> {
    const {
        search,
        forceRefresh = false,
        sortBy,
        sortOrder,
        page = 1,
        limit = 20,
        batch,
    } = options;

    let query = "";
    const params = new URLSearchParams();
    
    if (search && search.trim().length > 0) {
        params.append("search", search.trim());
    }
    
    if (sortBy) {
        params.append("sortBy", sortBy);
    }
    
    if (sortOrder) {
        params.append("sortOrder", sortOrder);
    }

    if (page > 1) {
        params.append("page", String(page));
    }

    if (limit !== 20) {
        params.append("limit", String(limit));
    }

    if (batch && batch.trim().length > 0) {
        params.append("batch", batch.trim());
    }
    
    if (params.toString()) {
        query = `?${params.toString()}`;
    }
    
    if (!query && studentsCache && !forceRefresh) return studentsCache;
    const res = await request<StudentsPageResponse>(`/api/students${query}`);
    if (!query) studentsCache = res;
    return res;
}

export async function fetchStudent(id: string): Promise<ApiStudent> {
    return request<ApiStudent>(`/api/students/${id}`);
}

export async function createStudent(
    data: CreateStudentPayload
): Promise<ApiStudent> {
    const result = await request<ApiStudent>("/api/students", {
        method: "POST",
        body: JSON.stringify(data),
    });
    studentsCache = null;
    return result;
}

export async function updateStudent(
    id: string,
    data: UpdateStudentPayload
): Promise<ApiStudent> {
    const result = await request<ApiStudent>(`/api/students/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
    studentsCache = null;
    return result;
}

export async function deleteStudent(id: string): Promise<void> {
    await request(`/api/students/${id}`, { method: "DELETE" });
    studentsCache = null;
}

export async function assignStudentToBatch(
    studentId: string,
    batchId: string
): Promise<ApiStudent> {
    const result = await request<ApiStudent>(`/api/students/${studentId}/batches`, {
        method: "POST",
        body: JSON.stringify({ batchId }),
    });
    studentsCache = null;
    return result;
}

export async function removeStudentFromBatch(
    studentId: string,
    batchId: string
): Promise<void> {
    await request(`/api/students/${studentId}/batches/${batchId}`, {
        method: "DELETE",
    });
    studentsCache = null;
}

export async function updateStudentRating(
    studentId: string,
    data: UpdateStudentRatingPayload
): Promise<any> {
    const result = await request<any>(`/api/students/${studentId}/rating`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
    studentsCache = null;
    return result;
}
