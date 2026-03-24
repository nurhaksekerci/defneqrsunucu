import { getApiBaseUrl } from "./api-base";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./auth-storage";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API hata ${status}`);
    this.name = "ApiError";
  }
}

function parseBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/** 401 sonrası tekrar gönderimde tükenmiş olabilecek FormData için kopya. */
function cloneFormData(src: FormData): FormData {
  const out = new FormData();
  for (const [key, value] of src.entries()) {
    out.append(key, value);
  }
  return out;
}

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  const res = await fetch(`${getApiBaseUrl()}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    clearTokens();
    return false;
  }
  const data = (await res.json()) as { access: string };
  setTokens(data.access, refresh);
  return true;
}

/**
 * Kimlikli API isteği. 401 sonrası bir kez refresh dener.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);

  if (json !== undefined && !(rest.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const access = getAccessToken();
  if (access) {
    headers.set("Authorization", `Bearer ${access}`);
  }

  // FormData kullanırken Content-Type elle verilmemeli; tarayıcı boundary ile multipart yazar.
  if (rest.body instanceof FormData) {
    headers.delete("Content-Type");
  }

  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const exec = () =>
    fetch(url, {
      ...rest,
      headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });

  let res = await exec();

  if (res.status === 401 && getRefreshToken()) {
    const ok = await refreshAccessToken();
    if (ok) {
      const h2 = new Headers(initHeaders);
      if (json !== undefined && !(rest.body instanceof FormData)) {
        h2.set("Content-Type", "application/json");
      }
      if (rest.body instanceof FormData) {
        h2.delete("Content-Type");
      }
      const na = getAccessToken();
      if (na) h2.set("Authorization", `Bearer ${na}`);
      const retryBody =
        rest.body instanceof FormData
          ? cloneFormData(rest.body)
          : rest.body;
      res = await fetch(url, {
        ...rest,
        headers: h2,
        body: json !== undefined ? JSON.stringify(json) : retryBody,
      });
    }
  }

  const text = await res.text();
  const data = parseBody(text);

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data as T;
}
