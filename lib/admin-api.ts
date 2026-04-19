import { api } from "@/lib/api";

const endpointMap = {
  users: "/api/v1/admin/users",
} as const;

export type AdminResourceName = keyof typeof endpointMap;

export function getAdminEndpoint(resource: string): string {
  if (resource in endpointMap) {
    return endpointMap[resource as AdminResourceName];
  }

  throw new Error(`Unsupported admin resource: ${resource}`);
}

export const adminFetch = async <T>(
  path: string,
  init?: RequestInit,
  query = ""
): Promise<T> => {
  return api<T>(`${path}${query}`, init);
};

export async function adminApi<T>(
  resource: string,
  init?: RequestInit,
  suffix = ""
): Promise<T> {
  const base = getAdminEndpoint(resource);
  return adminFetch<T>(base, init, suffix);
}

export function parseApiError(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    try {
      const maybeJson = JSON.parse(error.message) as { detail?: string };
      if (typeof maybeJson.detail === "string") {
        return maybeJson.detail;
      }
    } catch {
      // fallthrough
    }
    return error.message;
  }

  return "Unexpected API error";
}
