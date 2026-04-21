"use client";

import { useEffect, useState } from "react";
import { api, downloadXlsx } from "@/lib/api";
import { fmt, fmtPct, fmtShort } from "@/lib/format";
import { Panel, Badge, Spinner, ChartSkeleton, TableSkeleton } from "@/components/ui";
import YearMonthPicker from "@/components/YearMonthPicker";
import ScopeSwitch, { Scope } from "@/components/ScopeSwitch";
import Pager from "@/components/Pager";
import SortHeader, { SortState, sortRows } from "@/components/SortHeader";
import SearchInput from "@/components/SearchInput";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

const PAGE_SIZE = 20;

function ExcelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      다운로드
    </button>
  );
}

export default function VariancePage() {
  const [ym, setYm] = useState("2026-01");
  const [scope, setScope] = useState<Scope>("MONTHLY");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [varPage, setVarPage] = useState(0);
  const [facPage, setFacPage] = useState(0);
  const [varSort, setVarSort] = useState<SortState | null>(null);
  const [facSort, setFacSort] = useState<SortState | null>(null);
  const [varKeyword, setVarKeyword] = useState("");
  const [facKeyword, setFacKeyword] = useState("");

  function loadData() {
    setLoading(true);
    api.variance(ym, scope).then(r => { setRows(r); setLoading(false); setFirstLoad(false); });
  }

  useEffect(() => {
    setVarPage(0); setFacPage(0);
    setVarSort(null); setFacSort(null);
    setVarKeyword(""); setFacKeyword("");
    loadData();
  }, [ym, scope]);

  const total = rows.reduce(
    (a: any, r: any) => ({
      budget: a.budget + Number(r.budgetCost || 0),
      actual: a.actual + Number(r.actualCost || 0),
    }), { budget: 0, actual: 0 });

  const vkw = varKeyword.toLowerCase();
  const filteredVar = vkw
    ? rows.filter((r: any) =>
        (r.projectCode || "").toLowerCase().includes(vkw) ||
        (r.projectName || "").toLowerCase().includes(vkw))
    : rows;
  const sortedVar = sortRows(filteredVar, varSort);
  const pagedVar = sortedVar.slice(varPage * PAGE_SIZE, (varPage + 1) * PAGE_SIZE);

  const fkw = facKeyword.toLowerCase();
  const filteredFac = fkw
    ? rows.filter((r: any) =>
        (r.projectCode || "").toLowerCase().includes(fkw) ||
        (r.projectName || "").toLowerCase().includes(fkw))
    : rows;
  const sortedFac = sortRows(filteredFac, facSort);
  const pagedFac = sortedFac.slice(facPage * PAGE_SIZE, (facPage + 1) * PAGE_SIZE);

  const dlVariance = () => downloadXlsx(api.exportVarianceUrl(ym, scope), `variance_${ym}_${scope}.xlsx`);

  if (firstLoad) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-32 bg-slate-200 rounded" />
          <div className="h-8 w-40 bg-slate-200 rounded" />
          <div className="h-8 w-24 bg-slate-200 rounded" />
        </div>
        <div className="rounded-xl bg-white shadow-sm">
          <div className="px-5 py-3 border-b"><div className="h-4 w-48 bg-slate-200 rounded" /></div>
          <div className="p-5"><ChartSkeleton height={320} /></div>
        </div>
        <div className="rounded-xl bg-white shadow-sm">
          <div className="px-5 py-3 border-b"><div className="h-4 w-32 bg-slate-200 rounded" /></div>
          <div className="p-5"><TableSkeleton rows={5} cols={8} /></div>
        </div>
        <div className="rounded-xl bg-white shadow-sm">
          <div className="px-5 py-3 border-b"><div className="h-4 w-56 bg-slate-200 rounded" /></div>
          <div className="p-5"><TableSkeleton rows={5} cols={7} /></div>
        </div>
      </div>
    );
  }

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
          {loading && <span className="text-xs text-slate-500 inline-flex items-center gap-2"><Spinner /> 불러오는 중</span>}
        </div>
      </div>

      <Panel title={`예산 vs 실적 · ${scope === "MONTHLY" ? `${ym.slice(0,4)}년 ${Number(ym.slice(5,7))}월` : `${ym.slice(0,4)}년`}`}
        right={<ExcelBtn onClick={dlVariance} />}>
        {loading ? (
          <ChartSkeleton height={320} />
        ) : (
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
        )}
      </Panel>

      <Panel title="차이분석 표" right={
        <div className="flex items-center gap-3">
          <SearchInput value={varKeyword} onChange={v => { setVarKeyword(v); setVarPage(0); }}
            onRefresh={loadData} placeholder="코드, 프로젝트 검색..." className="w-72" />
          <ExcelBtn onClick={dlVariance} />
        </div>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <SortHeader label="코드" sortKey="projectCode" current={varSort} onSort={s => { setVarSort(s); setVarPage(0); }} />
                <SortHeader label="프로젝트" sortKey="projectName" current={varSort} onSort={s => { setVarSort(s); setVarPage(0); }} />
                <SortHeader label="예산공수" sortKey="budgetHours" current={varSort} onSort={s => { setVarSort(s); setVarPage(0); }} className="text-right" />
                <SortHeader label="실적공수" sortKey="actualHours" current={varSort} onSort={s => { setVarSort(s); setVarPage(0); }} className="text-right" />
                <SortHeader label="예산원가" sortKey="budgetCost" current={varSort} onSort={s => { setVarSort(s); setVarPage(0); }} className="text-right" />
                <SortHeader label="실적원가" sortKey="actualCost" current={varSort} onSort={s => { setVarSort(s); setVarPage(0); }} className="text-right" />
                <SortHeader label="원가차이" sortKey="costVariance" current={varSort} onSort={s => { setVarSort(s); setVarPage(0); }} className="text-right" />
                <SortHeader label="차이%" sortKey="costVariancePct" current={varSort} onSort={s => { setVarSort(s); setVarPage(0); }} className="text-right" />
                <th className="p-2">상태</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="p-0"><TableSkeleton rows={4} cols={8} /></td></tr>
              ) : pagedVar.length > 0 ? pagedVar.map((r: any) => {
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
              }) : (
                <tr><td colSpan={9} className="p-6 text-center text-slate-500">데이터가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={varPage} total={filteredVar.length} pageSize={PAGE_SIZE} onChange={setVarPage} />
      </Panel>

      <Panel title="요인 분석 (가격차이 × 수량차이 분해)" right={
        <div className="flex items-center gap-3">
          <SearchInput value={facKeyword} onChange={v => { setFacKeyword(v); setFacPage(0); }}
            onRefresh={loadData} placeholder="코드, 프로젝트 검색..." className="w-72" />
          <ExcelBtn onClick={dlVariance} />
        </div>
      }>
        <p className="text-xs text-slate-500 mb-3">
          * 가격차이 = (실적단가 − 표준단가) × 실적공수 &nbsp;|&nbsp;
          수량차이 = (실적공수 − 예산공수) × 표준단가
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <SortHeader label="코드" sortKey="projectCode" current={facSort} onSort={s => { setFacSort(s); setFacPage(0); }} />
                <SortHeader label="프로젝트" sortKey="projectName" current={facSort} onSort={s => { setFacSort(s); setFacPage(0); }} />
                <SortHeader label="표준단가" sortKey="stdRate" current={facSort} onSort={s => { setFacSort(s); setFacPage(0); }} className="text-right" />
                <SortHeader label="실적단가" sortKey="actualRate" current={facSort} onSort={s => { setFacSort(s); setFacPage(0); }} className="text-right" />
                <SortHeader label="가격차이" sortKey="priceVariance" current={facSort} onSort={s => { setFacSort(s); setFacPage(0); }} className="text-right" />
                <SortHeader label="수량차이" sortKey="quantityVariance" current={facSort} onSort={s => { setFacSort(s); setFacPage(0); }} className="text-right" />
                <SortHeader label="합계(검증)" sortKey="costVariance" current={facSort} onSort={s => { setFacSort(s); setFacPage(0); }} className="text-right" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-0"><TableSkeleton rows={4} cols={7} /></td></tr>
              ) : pagedFac.length > 0 ? pagedFac.map((r: any) => {
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
              }) : (
                <tr><td colSpan={7} className="p-6 text-center text-slate-500">데이터가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={facPage} total={filteredFac.length} pageSize={PAGE_SIZE} onChange={setFacPage} />
      </Panel>
    </div>
  );
}
