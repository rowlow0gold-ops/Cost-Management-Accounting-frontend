"use client";

import { api, downloadXlsx } from "@/lib/api";
import { Panel, Badge, TableSkeleton } from "@/components/ui";
import Pager from "@/components/Pager";
import SortHeader from "@/components/SortHeader";
import SearchInput from "@/components/SearchInput";
import { useServerTable } from "@/lib/useServerTable";

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
  const t = useServerTable(
    (p) => api.auditPage(p),
    [],
    { pageSize: PAGE_SIZE, defaultSort: { key: "createdAt", dir: "desc" } },
  );

  if (t.firstLoad) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="rounded-xl bg-white shadow-sm">
          <div className="px-5 py-3 border-b"><div className="h-4 w-48 bg-slate-200 rounded" /></div>
          <div className="p-5"><TableSkeleton rows={8} cols={5} /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Panel title="감사 로그" right={
        <div className="flex items-center gap-3">
          <SearchInput value={t.keyword} onChange={t.setKeyword} onRefresh={t.reload}
            placeholder="사용자, 액션, 대상 검색..." className="w-72" />
          {t.total > 0 && (
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
          )}
        </div>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <SortHeader label="시각" sortKey="createdAt" current={t.sort} onSort={t.setSort} />
                <SortHeader label="사용자" sortKey="actor" current={t.sort} onSort={t.setSort} />
                <SortHeader label="액션" sortKey="action" current={t.sort} onSort={t.setSort} />
                <SortHeader label="대상" sortKey="entity" current={t.sort} onSort={t.setSort} />
                <SortHeader label="상세" sortKey="detail" current={t.sort} onSort={t.setSort} />
              </tr>
            </thead>
            <tbody>
              {t.loading ? (
                <tr><td colSpan={5} className="p-0"><TableSkeleton rows={5} cols={5} /></td></tr>
              ) : t.rows.length > 0 ? t.rows.map((r: any) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2 text-xs font-mono">{r.createdAt?.replace("T", " ").slice(0, 19)}</td>
                  <td className="p-2">{r.actor}</td>
                  <td className="p-2"><Badge tone={ACTION_TONE[r.action] || "slate"}>{r.action}</Badge></td>
                  <td className="p-2">{r.entity}{r.entityId ? ` #${r.entityId}` : ""}</td>
                  <td className="p-2 text-slate-600">{r.detail || "—"}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="p-6 text-center text-slate-500">감사 로그가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={t.page} total={t.total} pageSize={PAGE_SIZE} onChange={t.setPage} />
      </Panel>
    </div>
  );
}
