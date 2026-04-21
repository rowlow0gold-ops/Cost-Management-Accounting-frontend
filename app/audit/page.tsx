"use client";

import { useEffect, useState } from "react";
import { api, downloadXlsx } from "@/lib/api";
import { Panel, Badge } from "@/components/ui";
import Pager from "@/components/Pager";
import SortHeader, { SortState, sortRows } from "@/components/SortHeader";

const ACTION_TONE: Record<string, any> = {
  CREATE_TIMESHEET: "blue",
  SUBMIT_TIMESHEET: "yellow",
  APPROVE_TIMESHEET: "green",
  REJECT_TIMESHEET: "red",
  DELETE_TIMESHEET: "slate",
  ALLOCATE: "blue",
  TRANSFER: "blue",
};

const PAGE_SIZE = 20;

export default function AuditPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortState | null>(null);

  useEffect(() => { api.auditRecent().then(setRows).catch(() => setRows([])); }, []);

  const sorted = sortRows(rows, sort);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <Panel title="감사 로그 (최근 100건)" right={
        rows.length > 0 ? (
          <button type="button"
            onClick={() => downloadXlsx(api.exportAuditUrl(), "audit_log.xlsx")}
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
                <SortHeader label="시각" sortKey="createdAt" current={sort} onSort={s => { setSort(s); setPage(0); }} />
                <SortHeader label="사용자" sortKey="actor" current={sort} onSort={s => { setSort(s); setPage(0); }} />
                <SortHeader label="액션" sortKey="action" current={sort} onSort={s => { setSort(s); setPage(0); }} />
                <SortHeader label="대상" sortKey="entity" current={sort} onSort={s => { setSort(s); setPage(0); }} />
                <SortHeader label="상세" sortKey="detail" current={sort} onSort={s => { setSort(s); setPage(0); }} />
              </tr>
            </thead>
            <tbody>
              {paged.map((r: any) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2 text-xs font-mono">{r.createdAt?.replace("T", " ").slice(0, 19)}</td>
                  <td className="p-2">{r.actor}</td>
                  <td className="p-2"><Badge tone={ACTION_TONE[r.action] || "slate"}>{r.action}</Badge></td>
                  <td className="p-2">{r.entity}{r.entityId ? ` #${r.entityId}` : ""}</td>
                  <td className="p-2 text-slate-600">{r.detail || "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-slate-500">감사 로그가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={page} total={rows.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </Panel>
    </div>
  );
}
