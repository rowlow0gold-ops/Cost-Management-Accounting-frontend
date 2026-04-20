const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export type ApiError = { message: string; status: number };

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
    ...init,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).message || msg; } catch {}
    const err: ApiError = { message: msg, status: res.status };
    throw err;
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

export const api = {
  // Auth
  login:    (email: string, password: string) =>
    http<any>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (body: any) =>
    http<any>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),

  // Masters
  departments: () => http<any[]>("/api/masters/departments"),
  employees:   () => http<any[]>("/api/masters/employees"),
  projects:    () => http<any[]>("/api/masters/projects"),
  rates:       (ym?: string) =>
    http<any[]>(`/api/masters/rates${ym ? `?yearMonth=${ym}` : ""}`),
  costItems:   (ym: string) => http<any[]>(`/api/masters/cost-items?yearMonth=${ym}`),

  createDept:  (b: any) => http<any>("/api/masters/departments", { method: "POST", body: JSON.stringify(b) }),
  updateDept:  (id: number, b: any) => http<any>(`/api/masters/departments/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteDept:  (id: number) => http<any>(`/api/masters/departments/${id}`, { method: "DELETE" }),
  createEmp:   (b: any) => http<any>("/api/masters/employees", { method: "POST", body: JSON.stringify(b) }),
  updateEmp:   (id: number, b: any) => http<any>(`/api/masters/employees/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteEmp:   (id: number) => http<any>(`/api/masters/employees/${id}`, { method: "DELETE" }),
  createProj:  (b: any) => http<any>("/api/masters/projects", { method: "POST", body: JSON.stringify(b) }),
  updateProj:  (id: number, b: any) => http<any>(`/api/masters/projects/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteProj:  (id: number) => http<any>(`/api/masters/projects/${id}`, { method: "DELETE" }),

  // Timesheet
  timesheets: (status?: string) =>
    http<any[]>(`/api/timesheets${status ? `?status=${status}` : ""}`),
  createTimesheet: (b: any) => http<any>("/api/timesheets", { method: "POST", body: JSON.stringify(b) }),
  submitTimesheet: (id: number) => http<any>(`/api/timesheets/${id}/submit`, { method: "POST" }),
  approveTimesheet: (id: number) => http<any>(`/api/timesheets/${id}/approve`, { method: "POST" }),
  rejectTimesheet:  (id: number) => http<any>(`/api/timesheets/${id}/reject`,  { method: "POST" }),
  deleteTimesheet:  (id: number) => http<any>(`/api/timesheets/${id}`, { method: "DELETE" }),

  // Cost
  aggregate: (ym: string, level = "PROJECT", scope: "MONTHLY" | "ANNUAL" = "MONTHLY",
              breakdownByMonth = false) =>
    http<any[]>(`/api/cost/aggregate?yearMonth=${ym}&level=${level}&scope=${scope}&breakdownByMonth=${breakdownByMonth}`),
  variance:  (ym: string, scope: "MONTHLY" | "ANNUAL" = "MONTHLY") =>
    http<any[]>(`/api/cost/variance?yearMonth=${ym}&scope=${scope}`),
  varianceTimeSeries: (ym: string, scope: "MONTHLY" | "ANNUAL" = "MONTHLY") =>
    http<any[]>(`/api/cost/variance-timeseries?yearMonth=${ym}&scope=${scope}`),
  allocate:  (ym: string, basis: "HOURS" | "HEADCOUNT" | "REVENUE") =>
    http<any[]>("/api/cost/allocate", { method: "POST", body: JSON.stringify({ yearMonth: ym, basis }) }),
  transfer:  (b: any) => http<any>("/api/cost/transfer", { method: "POST", body: JSON.stringify(b) }),

  // Audit
  auditRecent: () => http<any[]>("/api/admin/audit"),

  // Export helpers (returns URL with token as query — use direct download)
  exportAggregateUrl: (ym: string, level: string, scope: "MONTHLY" | "ANNUAL" = "MONTHLY") =>
    `${BASE}/api/export/aggregate.xlsx?yearMonth=${ym}&level=${level}&scope=${scope}`,
  exportAggregateAllUrl: (ym: string, scope: "MONTHLY" | "ANNUAL" = "MONTHLY") =>
    `${BASE}/api/export/aggregate-all.xlsx?yearMonth=${ym}&scope=${scope}`,
  exportVarianceUrl: (ym: string, scope: "MONTHLY" | "ANNUAL" = "MONTHLY") =>
    `${BASE}/api/export/variance.xlsx?yearMonth=${ym}&scope=${scope}`,
};

/** For file download endpoints that need auth header. */
export async function downloadXlsx(url: string, filename: string) {
  const token = getToken();
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("다운로드 실패");
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
