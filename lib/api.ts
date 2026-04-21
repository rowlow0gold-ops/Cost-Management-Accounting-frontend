const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export type ApiError = { message: string; status: number };

/** Spring Page<T> response shape */
export type PageResponse<T = any> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;   // current page (0-based)
  size: number;
};

/** Params for paginated + searchable list endpoints */
export type PageParams = {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  keyword?: string;
};

function qs(params: Record<string, any>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    }
  }
  return parts.join("&");
}

const DEV_DELAY = 0; // ← 테스트용 지연 (배포 전 0으로 변경)
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  if (DEV_DELAY > 0) await delay(DEV_DELAY);
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

  // Masters — full list (for dropdowns)
  departments: () => http<any[]>("/api/masters/departments"),
  employees:   () => http<any[]>("/api/masters/employees"),
  projects:    () => http<any[]>("/api/masters/projects"),
  rates:       (ym?: string) =>
    http<any[]>(`/api/masters/rates${ym ? `?yearMonth=${ym}` : ""}`),
  costItems:   (ym: string) => http<any[]>(`/api/masters/cost-items?yearMonth=${ym}`),

  // Masters — paginated (for tables)
  departmentsPage: (p: PageParams) =>
    http<PageResponse>(`/api/masters/departments?${qs({ ...p, page: p.page ?? 0 })}`),
  employeesPage: (p: PageParams) =>
    http<PageResponse>(`/api/masters/employees?${qs({ ...p, page: p.page ?? 0 })}`),
  projectsPage: (p: PageParams) =>
    http<PageResponse>(`/api/masters/projects?${qs({ ...p, page: p.page ?? 0 })}`),
  costItemsPage: (ym: string, p: PageParams) =>
    http<PageResponse>(`/api/masters/cost-items?${qs({ yearMonth: ym, ...p, page: p.page ?? 0 })}`),

  createDept:  (b: any) => http<any>("/api/masters/departments", { method: "POST", body: JSON.stringify(b) }),
  updateDept:  (id: number, b: any) => http<any>(`/api/masters/departments/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteDept:  (id: number) => http<any>(`/api/masters/departments/${id}`, { method: "DELETE" }),
  createEmp:   (b: any) => http<any>("/api/masters/employees", { method: "POST", body: JSON.stringify(b) }),
  updateEmp:   (id: number, b: any) => http<any>(`/api/masters/employees/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteEmp:   (id: number) => http<any>(`/api/masters/employees/${id}`, { method: "DELETE" }),
  createProj:  (b: any) => http<any>("/api/masters/projects", { method: "POST", body: JSON.stringify(b) }),
  updateProj:  (id: number, b: any) => http<any>(`/api/masters/projects/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteProj:  (id: number) => http<any>(`/api/masters/projects/${id}`, { method: "DELETE" }),

  // Timesheet — paginated
  timesheets: (p: PageParams & { status?: string }) =>
    http<PageResponse>(`/api/timesheets?${qs({ ...p, page: p.page ?? 0 })}`),
  createTimesheet: (b: any) => http<any>("/api/timesheets", { method: "POST", body: JSON.stringify(b) }),
  submitTimesheet: (id: number) => http<any>(`/api/timesheets/${id}/submit`, { method: "POST" }),
  approveTimesheet: (id: number) => http<any>(`/api/timesheets/${id}/approve`, { method: "POST" }),
  rejectTimesheet:  (id: number) => http<any>(`/api/timesheets/${id}/reject`,  { method: "POST" }),
  deleteTimesheet:  (id: number) => http<any>(`/api/timesheets/${id}`, { method: "DELETE" }),
  bulkSubmitTimesheets:  () => http<any>("/api/timesheets/bulk/submit",  { method: "POST" }),
  bulkApproveTimesheets: () => http<any>("/api/timesheets/bulk/approve", { method: "POST" }),
  bulkRejectTimesheets:  () => http<any>("/api/timesheets/bulk/reject",  { method: "POST" }),
  bulkDeleteDraftTimesheets: () => http<any>("/api/timesheets/bulk/draft", { method: "DELETE" }),

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

  // Allocations — paginated
  allocationsPage: (ym: string, p: PageParams) =>
    http<PageResponse>(`/api/cost/allocations?${qs({ yearMonth: ym, ...p, page: p.page ?? 0 })}`),

  // Transfers — paginated
  transfersPage: (ym: string, p: PageParams) =>
    http<PageResponse>(`/api/cost/transfers?${qs({ yearMonth: ym, ...p, page: p.page ?? 0 })}`),
  transfer:  (b: any) => http<any>("/api/cost/transfer", { method: "POST", body: JSON.stringify(b) }),

  // Audit — paginated
  auditPage: (p: PageParams) =>
    http<PageResponse>(`/api/admin/audit?${qs({ ...p, page: p.page ?? 0 })}`),

  // Export helpers (returns URL with token as query — use direct download)
  exportAggregateUrl: (ym: string, level: string, scope: "MONTHLY" | "ANNUAL" = "MONTHLY") =>
    `${BASE}/api/export/aggregate.xlsx?yearMonth=${ym}&level=${level}&scope=${scope}`,
  exportAggregateAllUrl: (ym: string, scope: "MONTHLY" | "ANNUAL" = "MONTHLY") =>
    `${BASE}/api/export/aggregate-all.xlsx?yearMonth=${ym}&scope=${scope}`,
  exportTimesheetsUrl: (status?: string) =>
    `${BASE}/api/export/timesheets.xlsx${status ? `?status=${status}` : ""}`,
  exportTransfersUrl: (ym?: string) =>
    `${BASE}/api/export/transfers.xlsx${ym ? `?yearMonth=${ym}` : ""}`,
  exportCostItemsUrl: (ym?: string) =>
    `${BASE}/api/export/cost-items.xlsx${ym ? `?yearMonth=${ym}` : ""}`,
  exportAllocationsUrl: (ym: string) =>
    `${BASE}/api/export/allocations.xlsx?yearMonth=${ym}`,
  exportVarianceUrl: (ym: string, scope: "MONTHLY" | "ANNUAL" = "MONTHLY") =>
    `${BASE}/api/export/variance.xlsx?yearMonth=${ym}&scope=${scope}`,
  exportAuditUrl: () => `${BASE}/api/export/audit.xlsx`,
};

/** Validate an Excel file without importing. Returns { valid: number } or throws. */
export async function validateXlsx(path: string, file: File): Promise<any> {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  let json: any;
  try { json = await res.json(); } catch { json = {}; }
  if (!res.ok) throw { message: json.message || `검증 실패 (${res.status})`, status: res.status };
  return json;
}

/** Upload an Excel file to the given path. Returns the parsed JSON response. */
export async function uploadXlsx(path: string, file: File, mode?: "MERGE" | "REPLACE"): Promise<any> {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const url = mode ? `${BASE}${path}?mode=${mode}` : `${BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  let json: any;
  try { json = await res.json(); } catch { json = {}; }
  if (!res.ok) throw { message: json.message || `업로드 실패 (${res.status})`, status: res.status };
  return json;
}

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
