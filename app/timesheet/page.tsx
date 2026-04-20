"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { Panel, Button, Input, Select, Badge, ErrMsg } from "@/components/ui";
import { hasRole } from "@/lib/auth";
import { collect, required, positive, max, notFuture, Errors } from "@/lib/validate";
import { toast } from "@/components/Toast";

const STATUS_TONE: Record<string, any> = {
  DRAFT: "slate", SUBMITTED: "yellow", APPROVED: "green", REJECTED: "red",
};

export default function TimesheetPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("");

  const canApprove = hasRole("MANAGER");

  const [form, setForm] = useState({
    employeeId: "", projectId: "",
    workDate: new Date().toISOString().slice(0, 10),
    hours: "8", memo: "",
  });
  const [errors, setErrors] = useState<Errors>({});

  async function load() {
    const [e, p, t] = await Promise.all([
      api.employees(), api.projects(), api.timesheets(filter || undefined),
    ]);
    setEmployees(e); setProjects(p); setRows(t);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

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
      load();
    } catch (err) { toast.fromError(err); }
  }

  async function act(fn: () => Promise<any>, ok: string) {
    try { await fn(); toast.success(ok); load(); }
    catch (e) { toast.fromError(e); }
  }

  return (
    <div className="space-y-6">
      <Panel title="공수 입력 (Draft)">
        <form onSubmit={create} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="직원">
            <Select value={form.employeeId}
              onChange={e => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">선택</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.empNo} — {e.name} ({e.grade})</option>
              ))}
            </Select>
            <ErrMsg>{errors.employeeId}</ErrMsg>
          </Field>
          <Field label="프로젝트">
            <Select value={form.projectId}
              onChange={e => setForm({ ...form, projectId: e.target.value })}>
              <option value="">선택</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
              ))}
            </Select>
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
          <div className="col-span-full">
            <Button type="submit">저장 (Draft)</Button>
          </div>
        </form>
      </Panel>

      <Panel title="공수 목록 / 결재" right={
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
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-2">상태</th>
                <th className="p-2">근무일</th>
                <th className="p-2">직원</th>
                <th className="p-2">프로젝트</th>
                <th className="p-2 text-right">시간</th>
                <th className="p-2">메모</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2"><Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge></td>
                  <td className="p-2">{r.workDate}</td>
                  <td className="p-2">{r.employee?.name}</td>
                  <td className="p-2 font-mono">{r.project?.code}</td>
                  <td className="p-2 text-right">{fmt(r.hours)}</td>
                  <td className="p-2 text-slate-500">{r.memo || "—"}</td>
                  <td className="p-2 space-x-2 whitespace-nowrap">
                    {r.status === "DRAFT" && (
                      <Button variant="ghost"
                        onClick={() => act(() => api.submitTimesheet(r.id), "제출됨")}>
                        제출
                      </Button>
                    )}
                    {r.status === "SUBMITTED" && canApprove && (
                      <>
                        <Button
                          onClick={() => act(() => api.approveTimesheet(r.id), "승인됨")}>
                          승인
                        </Button>
                        <Button variant="danger"
                          onClick={() => act(() => api.rejectTimesheet(r.id), "반려됨")}>
                          반려
                        </Button>
                      </>
                    )}
                    {r.status === "DRAFT" && (
                      <Button variant="danger"
                        onClick={() => act(() => api.deleteTimesheet(r.id), "삭제됨")}>
                        삭제
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-slate-500">데이터가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
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
