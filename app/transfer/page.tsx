"use client";

import { useEffect, useRef, useState } from "react";
import { api, uploadXlsx, validateXlsx, downloadXlsx } from "@/lib/api";
import { fmt } from "@/lib/format";
import { Panel, Button, Input, Select, Badge, ErrMsg } from "@/components/ui";
import { collect, required, positive, differs, Errors } from "@/lib/validate";
import { toast } from "@/components/Toast";
import Pager from "@/components/Pager";
import SortHeader, { SortState, sortRows } from "@/components/SortHeader";
import YearMonthPicker from "@/components/YearMonthPicker";
import ImportConfirmModal, { ImportMode } from "@/components/ImportConfirmModal";

const PAGE_SIZE = 20;

export default function TransferPage() {
  const [depts, setDepts] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortState | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    yearMonth: "2026-04",
    sourceDepartmentId: "",
    targetDepartmentId: "",
    hours: "0",
    hourlyRate: "70000",
    memo: "",
  });

  async function load() {
    const [d, t] = await Promise.all([
      api.departments(),
      api.transfers(form.yearMonth),
    ]);
    setDepts(d);
    setRows(t);
    setPage(0);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [form.yearMonth]);

  function validate(): Errors {
    return collect([
      ["yearMonth", required(form.yearMonth)],
      ["sourceDepartmentId", required(form.sourceDepartmentId, "제공 본부를 선택하세요")],
      ["targetDepartmentId", required(form.targetDepartmentId, "수혜 본부를 선택하세요")
        || differs(form.sourceDepartmentId, form.targetDepartmentId,
                   "제공 본부와 수혜 본부는 달라야 합니다")],
      ["hours", positive(form.hours, "공수는 0보다 커야 합니다")],
      ["hourlyRate", positive(form.hourlyRate, "단가는 0보다 커야 합니다")],
    ]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("입력값을 확인해주세요.");
      return;
    }
    try {
      await api.transfer({
        yearMonth: form.yearMonth,
        sourceDepartmentId: Number(form.sourceDepartmentId),
        targetDepartmentId: Number(form.targetDepartmentId),
        hours: Number(form.hours),
        hourlyRate: Number(form.hourlyRate),
        memo: form.memo,
      });
      toast.success("내부대체 기록 완료");
      setForm({ ...form, hours: "0", memo: "" });
      load();
    } catch (e) { toast.fromError(e); }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = "";

    setUploading(true);
    try {
      const res = await validateXlsx("/api/cost/transfers/validate", file);
      toast.success(`${res.valid}건 검증 완료`);
    } catch (err) {
      toast.fromError(err);
      setUploading(false);
      return;
    }
    setUploading(false);

    if (rows.length > 0) {
      setPendingFile(file);
      setShowImportConfirm(true);
    } else {
      doImport(file);
    }
  }

  async function doImport(file: File, mode?: "MERGE" | "REPLACE") {
    setUploading(true);
    try {
      const res = await uploadXlsx("/api/cost/transfers/import", file, mode);
      toast.success(res.message || "업로드 완료");
      load();
    } catch (err) { toast.fromError(err); }
    finally { setUploading(false); }
  }

  function handleImportConfirm(mode: ImportMode) {
    setShowImportConfirm(false);
    if (mode && pendingFile) {
      if (mode === "REPLACE_SUBMIT") {
        doImport(pendingFile, "REPLACE");
      } else {
        doImport(pendingFile, mode);
      }
    }
    setPendingFile(null);
  }

  const amount = Number(form.hours || 0) * Number(form.hourlyRate || 0);
  const sorted = sortRows(rows, sort);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <Panel title="내부대체가액 기록">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="회계월">
            <YearMonthPicker value={form.yearMonth} onChange={v => setForm({ ...form, yearMonth: v })} />
          </Field>
          <Field label="제공 본부 (Source)">
            <Select value={form.sourceDepartmentId}
              onChange={e => setForm({ ...form, sourceDepartmentId: e.target.value })}>
              <option value="">선택</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
            </Select>
            <ErrMsg>{errors.sourceDepartmentId}</ErrMsg>
          </Field>
          <Field label="수혜 본부 (Target)">
            <Select value={form.targetDepartmentId}
              onChange={e => setForm({ ...form, targetDepartmentId: e.target.value })}>
              <option value="">선택</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
            </Select>
            <ErrMsg>{errors.targetDepartmentId}</ErrMsg>
          </Field>
          <Field label="공수 (h)">
            <Input type="number" step="0.5" value={form.hours}
              onChange={e => setForm({ ...form, hours: e.target.value })} />
            <ErrMsg>{errors.hours}</ErrMsg>
          </Field>
          <Field label="시간당 단가 (KRW)">
            <Input type="number" value={form.hourlyRate}
              onChange={e => setForm({ ...form, hourlyRate: e.target.value })} />
            <ErrMsg>{errors.hourlyRate}</ErrMsg>
          </Field>
          <Field label="대체가액 (자동 계산)">
            <div className="border rounded px-3 py-1.5 bg-slate-50 text-sm font-mono">
              {fmt(amount)} KRW
            </div>
          </Field>
          <Field label="메모" wide>
            <Input value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} />
          </Field>
          <div className="col-span-full flex items-center gap-3">
            <Button type="submit">기록</Button>
            <span className="text-xs text-slate-400">또는</span>
            <input ref={fileRef} type="file" accept=".xlsx" onChange={handleFileSelect} className="hidden" />
            <Button type="button" variant="ghost" disabled={uploading}
              onClick={() => fileRef.current?.click()}>
              {uploading ? "업로드 중..." : "Excel 일괄 등록"}
            </Button>
            <button type="button"
              onClick={() => setShowFormat(true)}
              className="text-xs text-blue-500 hover:text-blue-700 underline underline-offset-2">
              양식 안내
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="내부대체 내역" right={
        rows.length > 0 ? (
          <button type="button"
            onClick={() => downloadXlsx(
              api.exportTransfersUrl(form.yearMonth),
              `transfers_${form.yearMonth}.xlsx`
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
        ) : null
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <SortHeader label="회계월" sortKey="yearMonth" current={sort} onSort={s => { setSort(s); setPage(0); }} />
                <SortHeader label="제공 본부" sortKey="sourceDepartment.name" current={sort} onSort={s => { setSort(s); setPage(0); }} />
                <SortHeader label="수혜 본부" sortKey="targetDepartment.name" current={sort} onSort={s => { setSort(s); setPage(0); }} />
                <SortHeader label="배부기준" sortKey="basis" current={sort} onSort={s => { setSort(s); setPage(0); }} />
                <SortHeader label="대체가액" sortKey="amount" current={sort} onSort={s => { setSort(s); setPage(0); }} className="text-right" />
                <SortHeader label="메모" sortKey="memo" current={sort} onSort={s => { setSort(s); setPage(0); }} />
              </tr>
            </thead>
            <tbody>
              {paged.map((r: any) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.yearMonth}</td>
                  <td className="p-2">{r.sourceDepartment?.name}</td>
                  <td className="p-2">{r.targetDepartment?.name || "—"}</td>
                  <td className="p-2"><Badge>{r.basis}</Badge></td>
                  <td className="p-2 text-right font-mono">{fmt(r.amount)}</td>
                  <td className="p-2 text-slate-500">{r.memo || "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">해당 월의 내부대체 내역이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={page} total={rows.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </Panel>

      {showImportConfirm && <ImportConfirmModal
        onSelect={handleImportConfirm}
        onBackup={() => downloadXlsx(
          api.exportTransfersUrl(form.yearMonth),
          `transfers_backup_${form.yearMonth}.xlsx`
        )}
      />}

      {showFormat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowFormat(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold text-sm">내부대체 Excel 업로드 양식 안내</h3>
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
                      <th className="p-2 text-left font-semibold">A: 회계월</th>
                      <th className="p-2 text-left font-semibold">B: 제공본부코드</th>
                      <th className="p-2 text-left font-semibold">C: 수혜본부코드</th>
                      <th className="p-2 text-left font-semibold">D: 공수</th>
                      <th className="p-2 text-left font-semibold">E: 시간당단가</th>
                      <th className="p-2 text-left font-semibold">F: 메모</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    <tr className="border-t">
                      <td className="p-2">2026-04</td>
                      <td className="p-2">HQ3</td>
                      <td className="p-2">HQ4</td>
                      <td className="p-2">40</td>
                      <td className="p-2">70000</td>
                      <td className="p-2">IT 개발지원</td>
                    </tr>
                    <tr className="border-t bg-slate-50/50">
                      <td className="p-2">2026-04</td>
                      <td className="p-2">HQ1</td>
                      <td className="p-2">HQ5</td>
                      <td className="p-2">20</td>
                      <td className="p-2">65000</td>
                      <td className="p-2">경영기획 자문</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <p><span className="font-medium text-slate-700">회계월</span> — yyyy-MM 형식 (예: 2026-04)</p>
                <p><span className="font-medium text-slate-700">제공본부코드</span> — 서비스를 제공하는 본부 코드 (예: HQ3)</p>
                <p><span className="font-medium text-slate-700">수혜본부코드</span> — 서비스를 받는 본부 코드 (예: HQ4)</p>
                <p><span className="font-medium text-slate-700">공수</span> — 투입 공수 (0보다 큰 숫자)</p>
                <p><span className="font-medium text-slate-700">시간당단가</span> — 시간당 단가 KRW (0보다 큰 숫자)</p>
                <p><span className="font-medium text-slate-700">메모</span> — 선택 사항</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                최대 <span className="font-semibold">200건</span>까지 업로드 가능합니다.
                대체가액은 공수 × 시간당단가로 자동 계산됩니다.
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
    <label className={`text-sm ${wide ? "col-span-1 sm:col-span-2 lg:col-span-3" : ""}`}>
      <span className="block text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
