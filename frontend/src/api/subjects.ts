const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("ujaasToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function requestRaw(path: string, options: RequestInit = {}) {
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
    return { ok: false as const, status: response.status, data };
  }
  return { ok: true as const, status: response.status, data };
}

export interface ApiSubject {
  id: string;
  name: string;
}

export async function fetchSubjects(): Promise<ApiSubject[]> {
  const result = await requestRaw("/api/subjects");
  if (!result.ok) {
    throw new Error((result.data as any)?.message || "Request failed");
  }
  return result.data as ApiSubject[];
}

export async function deleteSubjectGlobal(subjectId: string): Promise<{
  ok: boolean;
  status: number;
  links?: Record<string, number>;
  message?: string;
}> {
  const result = await requestRaw(`/api/subjects/${subjectId}`, { method: "DELETE" });
  if (!result.ok) {
    return {
      ok: false,
      status: result.status,
      links: (result.data as any)?.links,
      message: (result.data as any)?.message,
    };
  }
  return { ok: true, status: result.status };
}

export async function deleteSubjectFromBatch(batchId: string, subjectId: string): Promise<{
  ok: boolean;
  status: number;
  links?: Record<string, number>;
  message?: string;
  action?: "removed" | "deleted";
}> {
  const result = await requestRaw(`/api/batches/${batchId}/subjects/${subjectId}`, { method: "DELETE" });
  if (!result.ok) {
    return {
      ok: false,
      status: result.status,
      links: (result.data as any)?.links,
      message: (result.data as any)?.message,
    };
  }
  return { ok: true, status: result.status, action: (result.data as any)?.action };
}
