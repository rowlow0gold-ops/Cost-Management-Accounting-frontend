export type Session = {
  token: string;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "USER";
  departmentId?: number | null;
};

const KEY = "session";

export function saveSession(data: {
  token: string; email: string; name: string; role: string; departmentId?: number | null;
}) {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", data.token);
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem(KEY);
}

export function hasRole(role: "ADMIN" | "MANAGER" | "USER"): boolean {
  const s = getSession();
  if (!s) return false;
  if (role === "USER") return true;
  if (role === "MANAGER") return s.role === "ADMIN" || s.role === "MANAGER";
  return s.role === "ADMIN";
}
