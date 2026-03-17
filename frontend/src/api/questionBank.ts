function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("ujaasToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
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

async function runFormRequest(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await runRequest(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as any)?.message || "Request failed");
  }
  return data as T;
}

export interface ApiQuestionBankBatchSummary {
  id: string;
  name: string;
}

export interface ApiQuestionBankFile {
  id: string;
  subject_name: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  file_url: string;
  original_file_name: string;
  created_by: string;
  created_at: string;
  batch_ids: string[];
  batches: ApiQuestionBankBatchSummary[];
}

export interface ApiQuestionBankListResponse {
  items: ApiQuestionBankFile[];
  accessibleBatches?: ApiQuestionBankBatchSummary[];
  assignedBatch?: ApiQuestionBankBatchSummary | null;
}

export interface FetchQuestionBankParams {
  batch_id?: string;
  subject_name?: string;
  search?: string;
  sort?: "name_asc" | "name_desc" | "newest" | "oldest" | "difficulty_asc" | "difficulty_desc";
}

export async function apiFetchQuestionBank(params: FetchQuestionBankParams = {}): Promise<ApiQuestionBankListResponse> {
  const searchParams = new URLSearchParams();
  if (params.batch_id) searchParams.set("batch_id", params.batch_id);
  if (params.subject_name) searchParams.set("subject_name", params.subject_name);
  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);

  const query = searchParams.toString();
  return request<ApiQuestionBankListResponse>(`/api/question-bank${query ? `?${query}` : ""}`);
}

export async function apiUploadQuestionBank(formData: FormData): Promise<ApiQuestionBankFile> {
  const response = await runFormRequest("/api/question-bank/upload", {
    method: "POST",
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as any)?.message || "Upload failed");
  }
  return data as ApiQuestionBankFile;
}

export async function apiDeleteQuestionBankFromBatch(fileId: string, batchId: string): Promise<void> {
  await request<void>(`/api/question-bank/${fileId}/batches/${batchId}`, {
    method: "DELETE",
  });
}
import { API_BASE_URL } from "./base";
