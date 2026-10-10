const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

/**
 * Resolves raw media/image paths to absolute URLs.
 * Handles external URLs, relative image paths, and static routes.
 */
export function resolveMediaUrl(raw?: string | null): string {
  if (!raw) return "";
  const value = raw.trim();
  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  if (value.startsWith("images/")) {
    return `${API_BASE}/static/${value}`;
  }
  if (value.startsWith("/static/")) {
    return `${API_BASE}${value}`;
  }
  if (value.startsWith("/media/")) {
    return value;
  }
  return value;
}
