"use client";

import { useEffect, useRef, useState } from "react";
import { api, uploadXlsx, validateXlsx, downloadXlsx } from "@/lib/api";
import { fmt } from "@/lib/format";
import { Panel, Button, Input, Select, Badge, Spinner } from "@/components/ui";
import YearMonthPicker from "@/components/YearMonthPicker";
import { toast } from "@/components/Toast";
import Pager from "@/components/Pager";
import ImportConfirmModal, { ImportMode } from "@/components/ImportConfirmModal";
import SortHeader, { SortState, sortRows } from "@/components/SortHeader";

const PAGE_SIZE = 20;

export default function AllocationPage() {
  const [ym, setYm] = useState("2026-01");
  const [basis, setBasis] = useState<"HOURS" | "HEADCOUNT" | "REVENUE">("HOURS");
  const [result, setResult] = useState<any[]>([]);
  const [costItems, setCostItems] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const [costPage, setCostPage] = useState(0);
  const [allocPage, setAllocPage] = useState(0);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [costSort, setCostSort] = useState<SortState | null>(null);
  const [allocSort, setAllocSort] = useState<SortState | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadCostItems() {
    try { setCostItems(await api.costItems(ym)); setCostPage(0); } catch {}
  }
  useEffect(() => { loadCostItems(); /* eslint-disable-next-line */ }, [ym]);

  async function run() {
    setRunning(true);
    try {
      const r = await api.allocate(ym, basis);
      setResult(r);
      setAllocPage(0);
      if (r.length === 0) toast.info("배분 대상 데이터가 없습니다.");
      else toast.success(`${r.length}건의 배분이 생성되었습니다.`);
    } catch (e) { toast.fromError(e); }
    finally { setRunning(false); }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = "";

    setUploading(true);
    try {
      const res = await validateXlsx("/api/masters/cost-items/validate", file);
      toast.success(`${res.valid}건 검증 완료`);
    } catch (err) {
      toast.fromError(err);
      setUploading(false);
      return;
    }
    setUploading(false);

    if (costItems.length > 0) {
      setPendingFile(file);
      setShowImportConfirm(true);
    } else {
      doImport(file);
    }
  }

  async function doImport(file: File, mode?: "MERGE" | "REPLACE") {
    setUploading(true);
    try {
      const res = await uploadXlsx("/api/masters/cost-items/import", file, mode);
      toast.success(res.message || "업로드 완료");
      loadCostItems();
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

  const sortedCost = sortRows(costItems, costSort);
  const sortedAlloc = sortRows(result, allocSort);

  const pagedCostItems = sortedCost.slice(costPage * PAGE_SIZE, (costPage + 1) * PAGE_SIZE);
  const pagedResult = sortedAlloc.slice(allocPage * PAGE_SIZE, (allocPage + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <Panel title="배분 실행 조건">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <Field label="회계월">
            <YearMonthPicker value={ym} onChange={setYm} />
          </Field>
          <Field label="배부 기준">
            <Select value={basis} onChange={e => setBasis(e.target.value as any)}>
              <option value="HOURS">공수 (Hours)</option>
              <option value="HEADCOUNT">인원수 (Headcount)</option>
              <option value="REVENUE">매출/예산 (Revenue)</option>
            </Select>
          </Field>
          <div><Button onClick={run} disabled={running} className="w-full sm:w-auto">
            {running ? <span className="inline-flex items-center gap-2"><Spinner /> 실행 중...</span> : "배분 실행"}
          </Button></div>
        </div>
      </Panel>

      <Panel title="해당월 간접비" right={
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".xlsx" onChange={handleFileSelect} className="hidden" />
          <Button variant="ghost" disabled={uploading}
            onClick={() => fileRef.current?.click()}>
            {uploading ? "업로드 중..." : "Excel 일괄 등록"}
          </Button>
          <button type="button"
            onClick={() => setShowFormat(true)}
            className="text-xs text-blue-500 hover:text-blue-700 underline underline-offset-2">
            양식 안내
          </button>
        </div>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <SortHeader label="본부" sortKey="department.name" current={costSort} onSort={s => { setCostSort(s); setCostPage(0); }} />
                <SortHeader label="유형" sortKey="type" current={costSort} onSort={s => { setCostSort(s); setCostPage(0); }} />
                <SortHeader label="항목" sortKey="category" current={costSort} onSort={s => { setCostSort(s); setCostPage(0); }} />
                <SortHeader label="금액" sortKey="amount" current={costSort} onSort={s => { setCostSort(s); setCostPage(0); }} className="text-right" />
              </tr>
            </thead>
            <tbody>
              {pagedCostItems.map((c: any) => (
                <tr key={c.id} className="border-b">
                  <td className="p-2">{c.department?.name || "—"}</td>
                  <td className="p-2"><Badge tone="blue">{c.type}</Badge></td>
                  <td className="p-2">{c.category}</td>
                  <td className="p-2 text-right">{fmt(c.amount)}</td>
                </tr>
              ))}
              {costItems.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-slate-500">간접비 등록이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={costPage} total={costItems.length} pageSize={PAGE_SIZE} onChange={setCostPage} />
      </Panel>

      <Panel title="배분 결과" right={
        result.length > 0 ? (
          <button type="button"
            onClick={() => downloadXlsx(
              api.exportAllocationsUrl(ym),
              `allocations_${ym}.xlsx`
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
                <SortHeader label="출처 본부" sortKey="sourceDepartment.name" current={allocSort} onSort={s => { setAllocSort(s); setAllocPage(0); }} />
                <SortHeader label="대상 프로젝트" sortKey="targetProject.code" current={allocSort} onSort={s => { setAllocSort(s); setAllocPage(0); }} />
                <SortHeader label="배부기준" sortKey="basis" current={allocSort} onSort={s => { setAllocSort(s); setAllocPage(0); }} />
                <SortHeader label="배분액" sortKey="amount" current={allocSort} onSort={s => { setAllocSort(s); setAllocPage(0); }} className="text-right" />
              </tr>
            </thead>
            <tbody>
              {pagedResult.map((r: any) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.sourceDepartment?.name}</td>
                  <td className="p-2 font-mono">{r.targetProject?.code}</td>
                  <td className="p-2"><Badge>{r.basis}</Badge></td>
                  <td className="p-2 text-right">{fmt(r.amount)}</td>
                </tr>
              ))}
              {result.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-slate-500">아직 배분을 실행하지 않았습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={allocPage} total={result.length} pageSize={PAGE_SIZE} onChange={setAllocPage} />
      </Panel>

      {showImportConfirm && <ImportConfirmModal
        onSelect={handleImportConfirm}
        onBackup={() => downloadXlsx(
          api.exportCostItemsUrl(ym),
          `cost_items_backup_${ym}.xlsx`
        )}
      />}

      {/* Format guide popup */}
      {showFormat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowFormat(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold text-sm">간접비 Excel 업로드 양식 안내</h3>
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
                      <th className="p-2 text-left font-semibold">B: 유형</th>
                      <th className="p-2 text-left font-semibold">C: 본부코드</th>
                      <th className="p-2 text-left font-semibold">D: 항목</th>
                      <th className="p-2 text-left font-semibold">E: 금액</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    <tr className="border-t">
                      <td className="p-2">2026-04</td>
                      <td className="p-2">INDIRECT</td>
                      <td className="p-2">HQ1</td>
                      <td className="p-2">사무실 임대료</td>
                      <td className="p-2">5000000</td>
                    </tr>
                    <tr className="border-t bg-slate-50/50">
                      <td className="p-2">2026-04</td>
                      <td className="p-2">INDIRECT</td>
                      <td className="p-2">HQ3</td>
                      <td className="p-2">공과금</td>
                      <td className="p-2">1200000</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-1.5 text-xs text-slate-500">
                <p><span className="font-medium text-slate-700">회계월</span> — yyyy-MM 형식 (예: 2026-04)</p>
                <p><span className="font-medium text-slate-700">유형</span> — DIRECT 또는 INDIRECT</p>
                <p><span className="font-medium text-slate-700">본부코드</span> — 등록된 본부 코드 (예: HQ1, HQ2, HQ3, HQ4, HQ5)</p>
                <p><span className="font-medium text-slate-700">항목</span> — 비용 항목명 (예: 사무실 임대료, 공과금)</p>
                <p><span className="font-medium text-slate-700">금액</span> — 금액 (0보다 큰 숫자)</p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                최대 <span className="font-semibold">200건</span>까지 업로드 가능합니다.
                업로드 후 배분 실행 버튼을 눌러 간접비를 프로젝트에 배분하세요.
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      <span className="block text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
