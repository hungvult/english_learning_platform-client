import { AUTH_COOKIE_NAME, getBrowserAuthToken } from "@/lib/auth-token";

const BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const getServerAuthToken = async (): Promise<string | null> => {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
};

const getAuthToken = async (): Promise<string | null> => {
  if (typeof window !== "undefined") {
    return getBrowserAuthToken();
  }

  return getServerAuthToken();
};

export async function api<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = await getAuthToken();
  const headers = new Headers(init?.headers);
  const isFormDataBody =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  if (!headers.has("Content-Type") && !isFormDataBody) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include", // sends httpOnly JWT cookie
    cache: init?.cache ?? "no-store",
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  // 204/205 responses and some DELETE endpoints intentionally return no body.
  if (res.status === 204 || res.status === 205) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") ?? "";
  const contentLength = res.headers.get("content-length");
  if (contentLength === "0") {
    return undefined as T;
  }

  if (contentType.toLowerCase().includes("application/json")) {
    return (await res.json()) as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  return text as T;
}
