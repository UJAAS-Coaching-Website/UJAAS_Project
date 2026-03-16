import { request } from "./auth";

export interface FacultyToRate {
    id: string;
    name: string;
    subject: string;
}

export interface ReviewSession {
    id: string;
    start_time: string;
    expiry_time: string;
    is_active: boolean;
}

export async function triggerReviewSession(): Promise<any> {
    return request("/api/faculty-reviews/trigger", {
        method: "POST"
    });
}

export async function getFacultiesToRate(): Promise<{ faculties: FacultyToRate[], session: ReviewSession | null }> {
    return request<{ faculties: FacultyToRate[], session: ReviewSession | null }>("/api/faculty-reviews/to-rate");
}

export async function submitFacultyRatings(ratings: { facultyId: string, rating: number }[]): Promise<any> {
    return request("/api/faculty-reviews/submit", {
        method: "POST",
        body: JSON.stringify({ ratings })
    });
}
