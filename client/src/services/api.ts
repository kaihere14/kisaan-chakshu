export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fields: Array<{ field: string; message: string }> = [],
    public readonly claimId?: string,
  ) { super(message); }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options, credentials: "same-origin", cache: "no-store",
      headers: { "X-Requested-With": "KisaanChakshu", ...options.headers },
    });
  } catch {
    throw new ApiError(0, "Unable to connect. Check your connection and try again.");
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status,
    body?.error?.message || "The service is unavailable. Please try again.", body?.error?.fields, body?.claimId);
  if (!body) throw new ApiError(502, "The service returned an unexpected response. Please try again.");
  return body as T;
}
