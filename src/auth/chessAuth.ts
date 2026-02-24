export const AUTH_TOKEN_COOKIE_NAME = "auth_token_chess";
export const ADMIN_ROLE = "admin";

// Для локальной отладки можно вручную задать роль, например "admin".
// В production/на реальном домене это значение игнорируется.
export const LOCALHOST_ROLE_OVERRIDE: string | null = null;
// Для локальной отладки можно вручную задать JWT.
// Если значение не пустое, токен будет взят отсюда, а не из cookie.
export const LOCALHOST_JWT_OVERRIDE = "";

type ChessJwtPayload = {
  iat?: number;
  exp?: number;
  data?: {
    id?: number | string;
    login?: string;
    email?: string;
    role?: string;
  };
};

const getCookieValue = (cookieName: string) => {
  if (typeof document === "undefined") {
    return "";
  }
  const escaped = cookieName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  if (!match?.[1]) {
    return "";
  }
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  return atob(padded);
};

const parseJwtPayload = (token: string): ChessJwtPayload | null => {
  if (!token) {
    return null;
  }
  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) {
    return null;
  }
  try {
    const payloadJson = decodeBase64Url(parts[1]);
    const parsed = JSON.parse(payloadJson) as ChessJwtPayload;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const normalizeRole = (role: string | null | undefined) => {
  const normalized = String(role ?? "")
    .trim()
    .toLowerCase();
  return normalized || null;
};

const isLocalhostHost = (hostname: string) =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

const normalizeJwtToken = (value: string | null | undefined) => {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return "";
  }
  return normalized.replace(/^Bearer\s+/i, "").trim();
};

const resolveTokenValue = () => {
  const manualToken = normalizeJwtToken(LOCALHOST_JWT_OVERRIDE);
  if (manualToken) {
    return manualToken;
  }
  return normalizeJwtToken(getCookieValue(AUTH_TOKEN_COOKIE_NAME));
};

export const resolveCurrentUserRole = () => {
  if (typeof window === "undefined") {
    return null;
  }
  if (isLocalhostHost(window.location.hostname) && LOCALHOST_ROLE_OVERRIDE) {
    return normalizeRole(LOCALHOST_ROLE_OVERRIDE);
  }
  const token = resolveTokenValue();
  const payload = parseJwtPayload(token);

  if (!payload) {
    return null;
  }
  if (typeof payload.exp === "number") {
    const now = Math.floor(Date.now() / 1000);
    if (now >= payload.exp) {
      return null;
    }
  }
  return normalizeRole(payload.data?.role);
};

export const resolveCurrentJwtToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const token = resolveTokenValue();
  if (!token) {
    return null;
  }
  const payload = parseJwtPayload(token);
  if (!payload) {
    return null;
  }
  if (typeof payload.exp === "number") {
    const now = Math.floor(Date.now() / 1000);
    if (now >= payload.exp) {
      return null;
    }
  }
  return token;
};

export const isAdminRole = (role: string | null | undefined) => {
  // return true;
  return normalizeRole(role) === ADMIN_ROLE;
};
