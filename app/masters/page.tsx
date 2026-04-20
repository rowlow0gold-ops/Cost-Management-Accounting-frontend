"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { Panel, Button, Input, Select } from "@/components/ui";
import { toast } from "@/components/Toast";
import { collect, required, positive, Errors } from "@/lib/validate";

type Tab = "dept" | "emp" | "proj";

export default function MastersPage() {
  const [tab, setTab] = useState<Tab>("dept");

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        {([
          ["dept", "본부 (Department)"],
          ["emp",  "직원 (Employee)"],
          ["proj", "프로젝트 (Project)"],
        ] as const).map(([k, l]) => (
          <button key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px whitespace-nowrap ${tab === k
              ? "border-brand-600 text-brand-700 font-semibold"
              : "border-transparent text-slate-600"}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === "dept" && <DeptTab />}
      {tab === "emp"  && <EmpTab />}
      {tab === "proj" && <ProjTab />}
    </div>
  );
}

/* ---------------- Department ---------------- */
function DeptTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ code: "", name: "" });

  async function load() { setRows(await api.departments()); }
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("코드와 이름을 모두 입력하세요.");
      return;
    }
    try {
      await api.createDept(form);
      toast.success("본부가 저장되었습니다.");
      setForm({ code: "", name: "" });
      load();
    } catch (e) { toast.fromError(e); }
  }

  async function remove(id: number) {
    if (!confirm("삭제할까요?")) return;
    try { await api.deleteDept(id); toast.success("삭제되었습니다."); load(); }
    catch (e) { toast.fromError(e); }
  }

  return (
    <>
      <Panel title="본부 추가">
        <form onSubmit={save} className="flex flex-wrap gap-3 items-end">
          <div className="w-40"><label className="text-xs text-slate-600">코드</label>
            <Input required value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })} /></div>
          <div className="w-64"><label className="text-xs text-slate-600">이름</label>
            <Input required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <Button>추가</Button>
        </form>
      </Panel>

      <Panel title={`본부 목록 (${rows.length})`}>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr><th className="p-2">ID</th><th className="p-2">코드</th><th className="p-2">이름</th><th className="p-2">Action</th></tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">{r.id}</td>
                <td className="p-2 font-mono">{r.code}</td>
                <td className="p-2">{r.name}</td>
                <td className="p-2">
                  <Button variant="danger" onClick={() => remove(r.id)}>삭제</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}

/* ---------------- Employee ---------------- */
function EmpTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [form, setForm] = useState({ empNo: "", name: "", grade: "사원", departmentId: "", hourlyRate: "25000" });

  async function load() {
    const [e, d] = await Promise.all([api.employees(), api.departments()]);
    setRows(e); setDepts(d);
  }
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const errs = collect([
      ["empNo", required(form.empNo, "사번을 입력하세요")],
      ["name", required(form.name, "이름을 입력하세요")],
      ["departmentId", required(form.departmentId, "본부를 선택하세요")],
      ["hourlyRate", positive(form.hourlyRate, "단가는 0보다 커야 합니다")],
    ]);
    if (Object.keys(errs).length > 0) {
      toast.error(Object.values(errs).join("\n"));
      return;
    }
    try {
      await api.createEmp({
        empNo: form.empNo,
        name: form.name,
        grade: form.grade,
        department: { id: Number(form.departmentId) },
        hourlyRate: Number(form.hourlyRate),
      });
      toast.success("직원이 추가되었습니다.");
      setForm({ empNo: "", name: "", grade: "사원", departmentId: "", hourlyRate: "25000" });
      load();
    } catch (e) { toast.fromError(e); }
  }

  async function remove(id: number) {
    if (!confirm("삭제할까요?")) return;
    try { await api.deleteEmp(id); toast.success("삭제되었습니다."); load(); }
    catch (e) { toast.fromError(e); }
  }

  return (
    <>
      <Panel title="직원 추가">
        <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div><label className="text-xs text-slate-600">사번</label>
            <Input required value={form.empNo} onChange={e => setForm({ ...form, empNo: e.target.value })} /></div>
          <div><label className="text-xs text-slate-600">이름</label>
            <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-xs text-slate-600">직급</label>
            <Select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
              {["사원","대리","과장","차장","부장"].map(g => <option key={g}>{g}</option>)}
            </Select></div>
          <div><label className="text-xs text-slate-600">본부</label>
            <Select required value={form.departmentId}
              onChange={e => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">선택</option>
              {depts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select></div>
          <div><label className="text-xs text-slate-600">시간당 단가</label>
            <Input type="number" required value={form.hourlyRate}
              onChange={e => setForm({ ...form, hourlyRate: e.target.value })} /></div>
          <div className="col-span-full"><Button>추가</Button></div>
        </form>
      </Panel>

      <Panel title={`직원 목록 (${rows.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-2">사번</th><th className="p-2">이름</th><th className="p-2">직급</th>
                <th className="p-2">본부</th><th className="p-2 text-right">단가</th><th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2 font-mono">{r.empNo}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.grade}</td>
                  <td className="p-2">{r.department?.name}</td>
                  <td className="p-2 text-right">{fmt(r.hourlyRate)}</td>
                  <td className="p-2"><Button variant="danger" onClick={() => remove(r.id)}>삭제</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

/* ---------------- Project ---------------- */
function ProjTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [form, setForm] = useState({ code: "", name: "", ownerDepartmentId: "", budgetHours: "1000", budgetCost: "80000000", startDate: "2026-01-01", endDate: "2026-12-31" });

  async function load() {
    const [p, d] = await Promise.all([api.projects(), api.departments()]);
    setRows(p); setDepts(d);
  }
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const errs = collect([
      ["code", required(form.code, "코드를 입력하세요")],
      ["name", required(form.name, "이름을 입력하세요")],
      ["ownerDepartmentId", required(form.ownerDepartmentId, "본부를 선택하세요")],
      ["budgetHours", positive(form.budgetHours, "예산 공수는 0보다 커야 합니다")],
      ["budgetCost", positive(form.budgetCost, "예산 원가는 0보다 커야 합니다")],
    ]);
    if (Object.keys(errs).length > 0) {
      toast.error(Object.values(errs).join("\n"));
      return;
    }
    if (form.endDate < form.startDate) {
      toast.error("종료일이 시작일보다 빠릅니다.");
      return;
    }
    try {
      await api.createProj({
        code: form.code,
        name: form.name,
        ownerDepartment: { id: Number(form.ownerDepartmentId) },
        budgetHours: Number(form.budgetHours),
        budgetCost: Number(form.budgetCost),
        startDate: form.startDate, endDate: form.endDate,
      });
      toast.success("프로젝트가 저장되었습니다.");
      setForm({ ...form, code: "", name: "" });
      load();
    } catch (e) { toast.fromError(e); }
  }

  async function remove(id: number) {
    if (!confirm("삭제할까요?")) return;
    try { await api.deleteProj(id); toast.success("삭제되었습니다."); load(); }
    catch (e) { toast.fromError(e); }
  }

  return (
    <>
      <Panel title="프로젝트 추가">
        <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div><label className="text-xs text-slate-600">코드</label>
            <Input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="text-xs text-slate-600">이름</label>
            <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-xs text-slate-600">주관 본부</label>
            <Select required value={form.ownerDepartmentId}
              onChange={e => setForm({ ...form, ownerDepartmentId: e.target.value })}>
              <option value="">선택</option>
              {depts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select></div>
          <div><label className="text-xs text-slate-600">예산 공수</label>
            <Input type="number" value={form.budgetHours}
              onChange={e => setForm({ ...form, budgetHours: e.target.value })} /></div>
          <div><label className="text-xs text-slate-600">예산 원가</label>
            <Input type="number" value={form.budgetCost}
              onChange={e => setForm({ ...form, budgetCost: e.target.value })} /></div>
          <div><label className="text-xs text-slate-600">시작</label>
            <Input type="date" value={form.startDate}
              onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
          <div><label className="text-xs text-slate-600">종료</label>
            <Input type="date" value={form.endDate}
              onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
          <div className="col-span-full"><Button>추가</Button></div>
        </form>
      </Panel>

      <Panel title={`프로젝트 목록 (${rows.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-2">코드</th><th className="p-2">이름</th><th className="p-2">본부</th>
                <th className="p-2 text-right">예산공수</th><th className="p-2 text-right">예산원가</th>
                <th className="p-2">기간</th><th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2 font-mono">{r.code}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.ownerDepartment?.name}</td>
                  <td className="p-2 text-right">{fmt(r.budgetHours)}</td>
                  <td className="p-2 text-right">{fmt(r.budgetCost)}</td>
                  <td className="p-2 text-slate-500 text-xs">{r.startDate} ~ {r.endDate}</td>
                  <td className="p-2"><Button variant="danger" onClick={() => remove(r.id)}>삭제</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
