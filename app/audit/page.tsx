"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Panel, Badge } from "@/components/ui";

const ACTION_TONE: Record<string, any> = {
  CREATE_TIMESHEET: "blue",
  SUBMIT_TIMESHEET: "yellow",
  APPROVE_TIMESHEET: "green",
  REJECT_TIMESHEET: "red",
  DELETE_TIMESHEET: "slate",
  ALLOCATE: "blue",
  TRANSFER: "blue",
};

export default function AuditPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api.auditRecent().then(setRows).catch(() => setRows([])); }, []);

  return (
    <div className="space-y-6">
      <Panel title="감사 로그 (최근 100건)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-2">시각</th>
                <th className="p-2">사용자</th>
                <th className="p-2">액션</th>
                <th className="p-2">대상</th>
                <th className="p-2">상세</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
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
      </Panel>
    </div>
  );
}
