const rawApiBaseUrl = (import.meta as any).env?.VITE_API_URL?.trim();

export const API_BASE_URL =
  rawApiBaseUrl && rawApiBaseUrl.length > 0 ? rawApiBaseUrl.replace(/\/$/, "") : "";
