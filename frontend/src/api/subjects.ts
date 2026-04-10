import { request, requestWithMeta } from "./auth";

async function requestRaw(path: string, options: RequestInit = {}) {
  return requestWithMeta(path, options);
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
