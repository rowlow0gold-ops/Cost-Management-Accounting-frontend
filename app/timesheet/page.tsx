"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, uploadXlsx, validateXlsx, downloadXlsx, PageParams } from "@/lib/api";
import { fmt } from "@/lib/format";
import { Panel, Button, Input, Select, Badge, ErrMsg, TableSkeleton, PageSkeleton } from "@/components/ui";
import SearchSelect from "@/components/SearchSelect";
import SearchInput from "@/components/SearchInput";
import { hasRole } from "@/lib/auth";
import { collect, required, positive, max, notFuture, Errors } from "@/lib/validate";
import { toast } from "@/components/Toast";
import Pager from "@/components/Pager";
import ImportConfirmModal, { ImportMode } from "@/components/ImportConfirmModal";
import SortHeader, { SortState } from "@/components/SortHeader";
import { useServerTable } from "@/lib/useServerTable";

const STATUS_TONE: Record<string, any> = {
  DRAFT: "slate", SUBMITTED: "yellow", APPROVED: "green", REJECTED: "red",
};
const PAGE_SIZE = 20;

export default function TimesheetPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("");
  const canApprove = hasRole("MANAGER");

  const [form, setForm] = useState({
    employeeId: "", projectId: "",
    workDate: new Date().toISOString().slice(0, 10),
    hours: "8", memo: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);

  // Server-side paginated table
  const t = useServerTable(
    (p) => api.timesheets({ ...p, status: filter || undefined }),
    [filter],
    { pageSize: PAGE_SIZE, defaultSort: { key: "workDate", dir: "desc" } },
  );

  // Load dropdown data (not paginated)
  useEffect(() => {
    Promise.all([api.employees(), api.projects()])
      .then(([e, p]) => { setEmployees(e); setProjects(p); })
      .catch(() => {});
  }, []);

  function validate(): Errors {
    return collect([
      ["employeeId", required(form.employeeId, "직원을 선택하세요")],
      ["projectId", required(form.projectId, "프로젝트를 선택하세요")],
      ["workDate", required(form.workDate) || notFuture(form.workDate)],
      ["hours", required(form.hours) || positive(form.hours, "공수는 0보다 커야 합니다")
               || max(form.hours, 24, "하루 최대 24시간까지 입력 가능합니다")],
    ]);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("입력값을 확인해주세요.");
      return;
    }
    try {
      await api.createTimesheet({
        employeeId: Number(form.employeeId),
        projectId: Number(form.projectId),
        workDate: form.workDate,
        hours: Number(form.hours),
        memo: form.memo,
      });
      toast.success("Draft으로 저장되었습니다.");
      setForm({ ...form, hours: "8", memo: "" });
      t.reload();
    } catch (err) { toast.fromError(err); }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = "";

    setUploading(true);
    try {
      const res = await validateXlsx("/api/timesheets/validate", file);
      toast.success(`${res.valid}건 검증 완료`);
    } catch (err) {
      toast.fromError(err);
      setUploading(false);
      return;
    }
    setUploading(false);

    if (t.total > 0) {
      setPendingFile(file);
      setShowImportConfirm(true);
    } else {
      doImport(file);
    }
  }

  async function doImport(file: File, mode?: "MERGE" | "REPLACE", autoSubmit?: boolean) {
    setUploading(true);
    try {
      const res = await uploadXlsx("/api/timesheets/import", file, mode);
      if (autoSubmit) {
        await api.bulkSubmitTimesheets();
        toast.success((res.message || "업로드 완료") + " → 전체 제출됨");
      } else {
        toast.success(res.message || "업로드 완료");
      }
      t.reload();
    } catch (err) { toast.fromError(err); }
    finally { setUploading(false); }
  }

  function handleImportConfirm(mode: ImportMode) {
    setShowImportConfirm(false);
    if (mode && pendingFile) {
      if (mode === "REPLACE_SUBMIT") {
        doImport(pendingFile, "REPLACE", true);
      } else {
        doImport(pendingFile, mode);
      }
    }
    setPendingFile(null);
  }

  async function act(fn: () => Promise<any>, ok: string) {
    try { await fn(); toast.success(ok); t.reload(); }
    catch (e) { toast.fromError(e); }
  }

  // Count draft/submitted in current page for bulk buttons
  const draftCount = t.rows.filter((r: any) => r.status === "DRAFT").length;
  const submittedCount = t.rows.filter((r: any) => r.status === "SUBMITTED").length;

  if (t.firstLoad) return <PageSkeleton formRows={2} tableRows={8} tableCols={7} />;

  return (
    <div className="space-y-6">
      <Panel title="공수 입력 (Draft)">
        <form onSubmit={create} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="직원">
            <SearchSelect
              value={form.employeeId}
              onChange={v => setForm({ ...form, employeeId: v })}
              placeholder="이름 또는 사번 검색..."
              options={employees.map(e => ({
                value: String(e.id),
                label: `${e.empNo} — ${e.name} (${e.grade})`,
              }))}
            />
            <ErrMsg>{errors.employeeId}</ErrMsg>
          </Field>
          <Field label="프로젝트">
            <SearchSelect
              value={form.projectId}
              onChange={v => setForm({ ...form, projectId: v })}
              placeholder="프로젝트 코드 또는 이름 검색..."
              options={projects.map(p => ({
                value: String(p.id),
                label: `${p.code} — ${p.name}`,
              }))}
            />
            <ErrMsg>{errors.projectId}</ErrMsg>
          </Field>
          <Field label="근무일">
            <Input type="date" value={form.workDate}
              onChange={e => setForm({ ...form, workDate: e.target.value })} />
            <ErrMsg>{errors.workDate}</ErrMsg>
          </Field>
          <Field label="시간(h)">
            <Input type="number" step="0.5" min="0" max="24" value={form.hours}
              onChange={e => setForm({ ...form, hours: e.target.value })} />
            <ErrMsg>{errors.hours}</ErrMsg>
          </Field>
          <Field label="메모" wide>
            <Input value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} />
          </Field>
          <div className="col-span-full flex items-center gap-3">
            <Button type="submit">저장 (Draft)</Button>
            <span className="text-xs text-slate-400">또는</span>
            <input ref={fileRef} type="file" accept=".xlsx" onChange={handleFileSelect}
              className="hidden" />
            <Button type="button" variant="ghost" disabled={uploading}
              onClick={() => fileRef.current?.click()}>
              {uploading ? "업로드 중..." : "Excel 일괄 등록 (.xlsx)"}
            </Button>
            <button type="button"
              onClick={() => setShowFormat(true)}
              className="text-xs text-blue-500 hover:text-blue-700 underline underline-offset-2">
              양식 안내
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="공수 목록 / 결재" right={
        <div className="flex items-center gap-3">
          <SearchInput value={t.keyword} onChange={t.setKeyword} onRefresh={t.reload}
            placeholder="직원, 프로젝트, 메모 검색..." className="w-72" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">상태</span>
            <Select className="w-36" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">전체</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </Select>
          </div>
          <div className="h-5 w-px bg-slate-200" />
          <button type="button"
            onClick={() => downloadXlsx(
              api.exportTimesheetsUrl(filter || undefined),
              `timesheets${filter ? "_" + filter : ""}.xlsx`
            )}
            className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            다운로드
          </button>
        </div>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <SortHeader label="상태" sortKey="status" current={t.sort} onSort={t.setSort} />
                <SortHeader label="근무일" sortKey="workDate" current={t.sort} onSort={t.setSort} />
                <SortHeader label="직원" sortKey="employee.name" current={t.sort} onSort={t.setSort} />
                <SortHeader label="프로젝트" sortKey="project.code" current={t.sort} onSort={t.setSort} />
                <SortHeader label="시간" sortKey="hours" current={t.sort} onSort={t.setSort} className="text-right" />
                <SortHeader label="메모" sortKey="memo" current={t.sort} onSort={t.setSort} />
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {t.loading ? (
                <tr><td colSpan={7} className="p-0"><TableSkeleton rows={5} cols={7} /></td></tr>
              ) : t.rows.length > 0 ? t.rows.map((r: any) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2"><Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge></td>
                  <td className="p-2">{r.workDate}</td>
                  <td className="p-2">{r.employee?.name}</td>
                  <td className="p-2 font-mono">{r.project?.code}</td>
                  <td className="p-2 text-right">{fmt(r.hours)}</td>
                  <td className="p-2 text-slate-500">{r.memo || "—"}</td>
                  <td className="p-2 space-x-1 whitespace-nowrap">
                    {r.status === "DRAFT" && (
                      <Button variant="ghost" className="text-xs px-2 py-1"
                        onClick={() => act(() => api.submitTimesheet(r.id), "제출됨")}>
                        제출
                      </Button>
                    )}
                    {r.status === "SUBMITTED" && canApprove && (
                      <>
                        <Button className="text-xs px-2 py-1"
                          onClick={() => act(() => api.approveTimesheet(r.id), "승인됨")}>
                          승인
                        </Button>
                        <Button variant="danger" className="text-xs px-2 py-1"
                          onClick={() => act(() => api.rejectTimesheet(r.id), "반려됨")}>
                          반려
                        </Button>
                      </>
                    )}
                    {r.status === "DRAFT" && (
                      <Button variant="danger" className="text-xs px-2 py-1"
                        onClick={() => act(() => api.deleteTimesheet(r.id), "삭제됨")}>
                        삭제
                      </Button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="p-6 text-center text-slate-500">데이터가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {!t.loading && (draftCount > 0 || submittedCount > 0) && (
          <div className="flex items-center gap-2 px-2 pt-3 flex-wrap">
            {draftCount > 0 && (
              <>
                <Button variant="ghost"
                  onClick={() => { if (confirm(`DRAFT ${draftCount}건을 전체 제출하시겠습니까?`)) act(() => api.bulkSubmitTimesheets(), "전체 제출됨"); }}>
                  전체 제출 ({draftCount})
                </Button>
                <Button variant="danger"
                  onClick={() => { if (confirm(`DRAFT ${draftCount}건을 전체 삭제하시겠습니까?`)) act(() => api.bulkDeleteDraftTimesheets(), "전체 삭제됨"); }}>
                  전체 삭제 ({draftCount})
                </Button>
              </>
            )}
            {submittedCount > 0 && canApprove && (
              <>
                {draftCount > 0 && <div className="h-5 w-px bg-slate-200" />}
                <Button
                  onClick={() => { if (confirm(`SUBMITTED ${submittedCount}건을 전체 승인하시겠습니까?`)) act(() => api.bulkApproveTimesheets(), "전체 승인됨"); }}>
                  전체 승인 ({submittedCount})
                </Button>
                <Button variant="danger"
                  onClick={() => { if (confirm(`SUBMITTED ${submittedCount}건을 전체 반려하시겠습니까?`)) act(() => api.bulkRejectTimesheets(), "전체 반려됨"); }}>
                  전체 반려 ({submittedCount})
                </Button>
              </>
            )}
          </div>
        )}
        <Pager page={t.page} total={t.total} pageSize={PAGE_SIZE} onChange={t.setPage} />
      </Panel>

      {showImportConfirm && <ImportConfirmModal
        onSelect={handleImportConfirm}
        onBackup={() => downloadXlsx(
          api.exportTimesheetsUrl(filter || undefined),
          `timesheets_backup.xlsx`
        )}
      />}

      {showFormat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowFormat(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold text-sm">Excel 업로드 양식 안내</h3>
              <button onClick={() => setShowFormat(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
            </div>
            <div className="px-5 py-4 space-y-4 text-sm">
              <p className="text-slate-600">
                <span className="font-medium text-slate-800">.xlsx</span> 파일의 첫 번째 시트를 읽습니다.
                1행은 헤더로 건너뛰고, 2행부터 데이터를 등록합니다.
              </p>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-2 text-left font-semibold">A: 사번</th>
                      <th className="p-2 text-left font-semibold">B: 프로젝트코드</th>
                      <th className="p-2 text-left font-semibold">C: 근무일</th>
                      <th className="p-2 text-left font-semibold">D: 시간</th>
                      <th className="p-2 text-left font-semibold">E: 메모</th>
                      <th className="p-2 text-left font-semibold">F: Action</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    <tr className="border-t">
                      <td className="p-2">E0001</td><td className="p-2">PRJ-001</td>
                      <td className="p-2">2026-04-15</td><td className="p-2">8</td>
                      <td className="p-2">경영전략 분석</td><td className="p-2">APPROVED</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <p><span className="font-medium text-slate-700">사번</span> — 직원 사번 (예: E0001)</p>
                <p><span className="font-medium text-slate-700">프로젝트코드</span> — 프로젝트 코드 (예: PRJ-001)</p>
                <p><span className="font-medium text-slate-700">근무일</span> — 날짜 형식 (yyyy-MM-dd)</p>
                <p><span className="font-medium text-slate-700">시간</span> — 투입 시간 (0.5 단위 가능, 최대 24)</p>
                <p><span className="font-medium text-slate-700">메모</span> — 선택 사항</p>
                <p><span className="font-medium text-slate-700">Action</span> — DRAFT / SUBMITTED / APPROVED / REJECTED (비워두면 DRAFT)</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                최대 <span className="font-semibold">1,000건</span>까지 업로드 가능합니다.
              </div>
            </div>
            <div className="px-5 py-3 border-t bg-slate-50 flex justify-end">
              <Button variant="ghost" onClick={() => setShowFormat(false)}>닫기</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, wide }:
  { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`text-sm ${wide ? "col-span-1 sm:col-span-2 lg:col-span-4" : ""}`}>
      <span className="block text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
