"use client";

import { useEffect, useState } from "react";
import { api, downloadXlsx } from "@/lib/api";
import { fmt, fmtPct, fmtShort } from "@/lib/format";
import { Panel, Button, Input, Badge, Spinner } from "@/components/ui";
import YearMonthPicker from "@/components/YearMonthPicker";
import ScopeSwitch, { Scope } from "@/components/ScopeSwitch";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

export default function VariancePage() {
  const [ym, setYm] = useState("2026-01");
  const [scope, setScope] = useState<Scope>("MONTHLY");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.variance(ym, scope).then(r => { setRows(r); setLoading(false); });
  }, [ym, scope]);

  const total = rows.reduce(
    (a: any, r: any) => ({
      budget: a.budget + Number(r.budgetCost || 0),
      actual: a.actual + Number(r.actualCost || 0),
    }), { budget: 0, actual: 0 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {scope === "MONTHLY" && (
            <>
              <label className="text-sm text-slate-600 whitespace-nowrap">회계월</label>
              <YearMonthPicker value={ym} onChange={setYm} />
            </>
          )}
          {scope === "ANNUAL" && (
            <>
              <label className="text-sm text-slate-600 whitespace-nowrap">회계연도</label>
              <YearMonthPicker value={ym} onChange={setYm} yearOnly />
            </>
          )}
          <ScopeSwitch value={scope} onChange={setScope} />
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-xs text-slate-500 inline-flex items-center gap-2"><Spinner /> 불러오는 중</span>}
          <Button variant="ghost"
            onClick={() => downloadXlsx(
              api.exportVarianceUrl(ym, scope),
              `variance_${ym}_${scope}.xlsx`)}>
            Excel 다운로드
          </Button>
        </div>
      </div>

      <Panel title={`예산 vs 실적 · ${scope === "MONTHLY" ? `${ym.slice(0,4)}년 ${Number(ym.slice(5,7))}월` : `${ym.slice(0,4)}년`}`}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={rows} margin={{ left: 10, right: 10, top: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="projectCode" tick={{ fontSize: 10 }} angle={-30}
                   textAnchor="end" height={60} />
            <YAxis tickFormatter={(v: any) => fmtShort(v)} width={70} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: any) => `${fmt(Number(v))} KRW`} />
            <Legend />
            <Bar dataKey="budgetCost" name="예산원가" fill="#94a3b8" maxBarSize={28} radius={[3,3,0,0]} />
            <Bar dataKey="actualCost" name="실적원가" fill="#1d4ed8" maxBarSize={28} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="차이분석 표" right={
        <span className="text-xs text-slate-500">
          예산 합계 {fmt(total.budget)} / 실적 합계 {fmt(total.actual)}
        </span>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-2">코드</th>
                <th className="p-2">프로젝트</th>
                <th className="p-2 text-right">예산공수</th>
                <th className="p-2 text-right">실적공수</th>
                <th className="p-2 text-right">예산원가</th>
                <th className="p-2 text-right">실적원가</th>
                <th className="p-2 text-right">원가차이</th>
                <th className="p-2 text-right">차이%</th>
                <th className="p-2">상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => {
                const over = Number(r.costVariance) > 0;
                const way  = Math.abs(Number(r.costVariancePct)) > 10;
                return (
                  <tr key={r.projectId} className="border-b">
                    <td className="p-2 font-mono">{r.projectCode}</td>
                    <td className="p-2">{r.projectName}</td>
                    <td className="p-2 text-right">{fmt(r.budgetHours)}</td>
                    <td className="p-2 text-right">{fmt(r.actualHours)}</td>
                    <td className="p-2 text-right">{fmt(r.budgetCost)}</td>
                    <td className="p-2 text-right">{fmt(r.actualCost)}</td>
                    <td className={`p-2 text-right ${over ? "text-red-600" : "text-emerald-600"}`}>
                      {fmt(r.costVariance)}
                    </td>
                    <td className="p-2 text-right">{fmtPct(r.costVariancePct)}</td>
                    <td className="p-2">
                      <Badge tone={over ? (way ? "red" : "yellow") : "green"}>
                        {over ? (way ? "초과 위험" : "초과") : "양호"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={9} className="p-6 text-center text-slate-500">데이터가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="요인 분석 (가격차이 × 수량차이 분해)">
        <p className="text-xs text-slate-500 mb-3">
          * 가격차이 = (실적단가 − 표준단가) × 실적공수 &nbsp;|&nbsp;
          수량차이 = (실적공수 − 예산공수) × 표준단가
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-2">코드</th>
                <th className="p-2">프로젝트</th>
                <th className="p-2 text-right">표준단가</th>
                <th className="p-2 text-right">실적단가</th>
                <th className="p-2 text-right">가격차이</th>
                <th className="p-2 text-right">수량차이</th>
                <th className="p-2 text-right">합계(검증)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => {
                const sum = Number(r.priceVariance || 0) + Number(r.quantityVariance || 0);
                return (
                  <tr key={r.projectId} className="border-b">
                    <td className="p-2 font-mono">{r.projectCode}</td>
                    <td className="p-2">{r.projectName}</td>
                    <td className="p-2 text-right">{fmt(r.stdRate)}</td>
                    <td className="p-2 text-right">{fmt(r.actualRate)}</td>
                    <td className={`p-2 text-right ${Number(r.priceVariance) > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {fmt(r.priceVariance)}
                    </td>
                    <td className={`p-2 text-right ${Number(r.quantityVariance) > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {fmt(r.quantityVariance)}
                    </td>
                    <td className="p-2 text-right text-slate-500">{fmt(sum)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
