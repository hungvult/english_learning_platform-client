const AUTH_STORAGE_KEY = "elp_access_token";
export const AUTH_COOKIE_NAME = "elp_access_token";

const readCookie = (cookieString: string, name: string): string | null => {
  const prefix = `${name}=`;
  const found = cookieString
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!found) return null;

  const value = found.slice(prefix.length);

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const persistAuthToken = (token: string) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(AUTH_STORAGE_KEY, token);

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(
    token
  )}; Path=/; SameSite=Lax${secure}`;
};

export const getBrowserAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (stored) return stored;

  const fromCookie = readCookie(document.cookie, AUTH_COOKIE_NAME);
  if (fromCookie) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, fromCookie);
  }

  return fromCookie;
};
