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

// Student Notification APIs
export async function fetchStudentNotifications(): Promise<any[]> {
    const res = await request<{ status: string, notifications: any[] }>("/api/notification-center/");
    return res.notifications;
}

export async function markNotificationAsRead(id: string): Promise<void> {
    await request(`/api/notification-center/${id}/read`, { method: "PUT" });
}

export async function deleteNotification(id: string): Promise<void> {
    await request(`/api/notification-center/${id}`, { method: "DELETE" });
}

export async function broadcastNotice(payload: { batchIds: string[], title: string, message: string }): Promise<void> {
    await request("/api/notification-center/broadcast", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}
