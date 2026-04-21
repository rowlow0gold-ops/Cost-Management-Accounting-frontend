"use client";

import { useRef, useState } from "react";
import { api, uploadXlsx, validateXlsx, downloadXlsx } from "@/lib/api";
import { fmt } from "@/lib/format";
import { Panel, Button, Select, Badge, TableSkeleton, PageSkeleton } from "@/components/ui";
import YearMonthPicker from "@/components/YearMonthPicker";
import SearchInput from "@/components/SearchInput";
import { toast } from "@/components/Toast";
import Pager from "@/components/Pager";
import ImportConfirmModal, { ImportMode } from "@/components/ImportConfirmModal";
import SortHeader from "@/components/SortHeader";
import { useServerTable } from "@/lib/useServerTable";

const PAGE_SIZE = 20;

export default function AllocationPage() {
  const [ym, setYm] = useState("2026-03");
  const [basis, setBasis] = useState<"HOURS" | "HEADCOUNT" | "REVENUE">("HOURS");
  const [result, setResult] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cost = useServerTable(
    (p) => api.costItemsPage(ym, p),
    [ym],
    { pageSize: PAGE_SIZE },
  );

  const alloc = useServerTable(
    (p) => api.allocationsPage(ym, p),
    [ym, result],
    { pageSize: PAGE_SIZE },
  );

  async function run() {
    setRunning(true);
    try {
      const r = await api.allocate(ym, basis);
      setResult(r);
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
    } catch (err) { toast.fromError(err); setUploading(false); return; }
    setUploading(false);
    if (cost.total > 0) { setPendingFile(file); setShowImportConfirm(true); }
    else doImport(file);
  }

  async function doImport(file: File, mode?: "MERGE" | "REPLACE") {
    setUploading(true);
    try {
      const res = await uploadXlsx("/api/masters/cost-items/import", file, mode);
      toast.success(res.message || "업로드 완료");
      cost.reload();
    } catch (err) { toast.fromError(err); }
    finally { setUploading(false); }
  }

  function handleImportConfirm(mode: ImportMode) {
    setShowImportConfirm(false);
    if (mode && pendingFile) {
      doImport(pendingFile, mode === "REPLACE_SUBMIT" ? "REPLACE" : mode);
    }
    setPendingFile(null);
  }

  if (cost.firstLoad) return <PageSkeleton formRows={1} tableRows={6} tableCols={4} />;

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
            {running ? "실행 중..." : "배분 실행"}
          </Button></div>
        </div>
      </Panel>

      <Panel title="해당월 간접비" right={
        <div className="flex items-center gap-2">
          <SearchInput value={cost.keyword} onChange={cost.setKeyword} onRefresh={cost.reload}
            placeholder="본부, 항목 검색..." className="w-72" />
          <input ref={fileRef} type="file" accept=".xlsx" onChange={handleFileSelect} className="hidden" />
          <Button variant="ghost" disabled={uploading}
            onClick={() => fileRef.current?.click()}>
            {uploading ? "업로드 중..." : "Excel 일괄 등록"}
          </Button>
          <button type="button" onClick={() => setShowFormat(true)}
            className="text-xs text-blue-500 hover:text-blue-700 underline underline-offset-2">
            양식 안내
          </button>
        </div>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <SortHeader label="본부" sortKey="department.name" current={cost.sort} onSort={cost.setSort} />
                <SortHeader label="유형" sortKey="type" current={cost.sort} onSort={cost.setSort} />
                <SortHeader label="항목" sortKey="category" current={cost.sort} onSort={cost.setSort} />
                <SortHeader label="금액" sortKey="amount" current={cost.sort} onSort={cost.setSort} className="text-right" />
              </tr>
            </thead>
            <tbody>
              {cost.loading ? (
                <tr><td colSpan={4} className="p-0"><TableSkeleton rows={4} cols={4} /></td></tr>
              ) : cost.rows.length > 0 ? cost.rows.map((c: any) => (
                <tr key={c.id} className="border-b">
                  <td className="p-2">{c.department?.name || "—"}</td>
                  <td className="p-2"><Badge tone="blue">{c.type}</Badge></td>
                  <td className="p-2">{c.category}</td>
                  <td className="p-2 text-right">{fmt(c.amount)}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="p-6 text-center text-slate-500">간접비 등록이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={cost.page} total={cost.total} pageSize={PAGE_SIZE} onChange={cost.setPage} />
      </Panel>

      <Panel title="배분 결과" right={
        <div className="flex items-center gap-3">
          <SearchInput value={alloc.keyword} onChange={alloc.setKeyword} onRefresh={alloc.reload}
            placeholder="본부, 프로젝트 검색..." className="w-72" />
          {alloc.total > 0 && (
            <button type="button"
              onClick={() => downloadXlsx(api.exportAllocationsUrl(ym), `allocations_${ym}.xlsx`)}
              className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              다운로드
            </button>
          )}
        </div>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <SortHeader label="출처 본부" sortKey="sourceDepartment.name" current={alloc.sort} onSort={alloc.setSort} />
                <SortHeader label="대상 프로젝트" sortKey="targetProject.code" current={alloc.sort} onSort={alloc.setSort} />
                <SortHeader label="배부기준" sortKey="basis" current={alloc.sort} onSort={alloc.setSort} />
                <SortHeader label="배분액" sortKey="amount" current={alloc.sort} onSort={alloc.setSort} className="text-right" />
              </tr>
            </thead>
            <tbody>
              {alloc.loading ? (
                <tr><td colSpan={4} className="p-0"><TableSkeleton rows={4} cols={4} /></td></tr>
              ) : alloc.rows.length > 0 ? alloc.rows.map((r: any) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.sourceDepartment?.name}</td>
                  <td className="p-2 font-mono">{r.targetProject?.code}</td>
                  <td className="p-2"><Badge>{r.basis}</Badge></td>
                  <td className="p-2 text-right">{fmt(r.amount)}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="p-6 text-center text-slate-500">아직 배분을 실행하지 않았습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={alloc.page} total={alloc.total} pageSize={PAGE_SIZE} onChange={alloc.setPage} />
      </Panel>

      {showImportConfirm && <ImportConfirmModal
        onSelect={handleImportConfirm}
        onBackup={() => downloadXlsx(api.exportCostItemsUrl(ym), `cost_items_backup_${ym}.xlsx`)}
      />}

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
                      <td className="p-2">2026-04</td><td className="p-2">INDIRECT</td>
                      <td className="p-2">HQ1</td><td className="p-2">사무실 임대료</td><td className="p-2">5000000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <p><span className="font-medium text-slate-700">회계월</span> — yyyy-MM 형식</p>
                <p><span className="font-medium text-slate-700">유형</span> — DIRECT 또는 INDIRECT</p>
                <p><span className="font-medium text-slate-700">본부코드</span> — 등록된 본부 코드</p>
                <p><span className="font-medium text-slate-700">항목</span> — 비용 항목명</p>
                <p><span className="font-medium text-slate-700">금액</span> — 0보다 큰 숫자</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                최대 <span className="font-semibold">200건</span>까지 업로드 가능합니다.
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
