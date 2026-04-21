"use client";

import { useEffect, useRef as useReactRef, useState } from "react";
import { api, downloadXlsx } from "@/lib/api";
import { fmt, fmtPct, fmtShort } from "@/lib/format";
import { Panel, Kpi, Button, Badge, Spinner, ChartSkeleton, TableSkeleton } from "@/components/ui";
import YearMonthPicker from "@/components/YearMonthPicker";
import ScopeSwitch, { Scope } from "@/components/ScopeSwitch";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line, ReferenceLine,
} from "recharts";
import { EmptyState } from "@/components/EmptyState";
import { ExportPngButton } from "@/components/ExportPng";
import Pager from "@/components/Pager";
import SortHeader, { SortState, sortRows } from "@/components/SortHeader";
import SearchInput from "@/components/SearchInput";

const COLORS = ["#1d4ed8", "#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626", "#2563eb", "#a855f7"];

export default function Dashboard() {
  const router = useRouter();
  const [ym, setYm] = useState("2026-03");
  const [byDept, setByDept] = useState<any[]>([]);
  const [byProj, setByProj] = useState<any[]>([]);
  const [byProjMonth, setByProjMonth] = useState<any[]>([]);
  const [projectsById, setProjectsById] = useState<Record<number, any>>({});
  const [byEmp, setByEmp] = useState<any[]>([]);
  const [byCompany, setByCompany] = useState<any[]>([]);
  const [variance, setVariance] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [drillLevel, setDrillLevel] = useState<"DEPARTMENT" | "PROJECT" | "EMPLOYEE">("DEPARTMENT");
  const [scope, setScope] = useState<Scope>("MONTHLY");
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [drillPage, setDrillPage] = useState(0);
  const [drillSort, setDrillSort] = useState<SortState | null>(null);
  const [drillKeyword, setDrillKeyword] = useState("");
  const PAGE_SIZE = 10;
  useEffect(() => { setDrillPage(0); setDrillSort(null); setDrillKeyword(""); }, [drillLevel, scope, ym]);

  // refs for PNG export
  const barRef = useReactRef<HTMLDivElement>(null);
  const pieRef = useReactRef<HTMLDivElement>(null);
  const trendRef = useReactRef<HTMLDivElement>(null);
  const [comparisonTotals, setComparisonTotals] = useState<{
    cost: number; hours: number; overBudget: number;
    projectCount: number; employeeCount: number;
  } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [d, p, e, c, v, ts] = await Promise.all([
        api.aggregate(ym, "DEPARTMENT", scope),
        api.aggregate(ym, "PROJECT", scope),
        api.aggregate(ym, "EMPLOYEE", scope),
        api.aggregate(ym, "COMPANY", scope),
        api.variance(ym, scope),
        api.varianceTimeSeries(ym, scope),
      ]);
      setByDept(d); setByProj(p); setByEmp(e); setByCompany(c);
      setVariance(v); setTrend(ts);
    } finally { setLoading(false); setFirstLoad(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [ym, scope]);

  // Always fetch previous-period totals for comparison.
  useEffect(() => {
    const prev = shiftPeriod(ym, scope);
    Promise.all([
      api.aggregate(prev, "DEPARTMENT", scope),
      api.aggregate(prev, "PROJECT",    scope),
      api.aggregate(prev, "EMPLOYEE",   scope),
      api.variance(prev, scope),
    ]).then(([d, p, e, v]) => {
      setComparisonTotals({
        cost: d.reduce((s, r) => s + Number(r.directCost ?? 0), 0),
        hours: d.reduce((s, r) => s + Number(r.hours ?? 0), 0),
        overBudget: v.filter((x: any) => Number(x.costVariance) > 0).length,
        projectCount: p.length,
        employeeCount: e.length,
      });
    }).catch(() => setComparisonTotals(null));
  }, [ym, scope]);

  useEffect(() => {
    api.projects().then((list: any[]) => {
      const map: Record<number, any> = {};
      list.forEach(p => { map[p.id] = p; });
      setProjectsById(map);
    }).catch(() => {});
  }, []);

  const totalCost = byDept.reduce((s, r) => s + Number(r.directCost ?? 0), 0);
  const totalHours = byDept.reduce((s, r) => s + Number(r.hours ?? 0), 0);
  const overBudget = variance.filter(v => Number(v.costVariance) > 0).length;

  if (firstLoad) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-24 bg-slate-200 rounded" />
          <div className="h-8 w-40 bg-slate-200 rounded" />
          <div className="flex-1" />
          <div className="h-8 w-8 bg-slate-200 rounded" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
              <div className="h-6 w-32 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-white shadow-sm">
          <div className="px-5 py-3 border-b"><div className="h-4 w-48 bg-slate-200 rounded" /></div>
          <div className="p-5"><ChartSkeleton height={300} /></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl bg-white shadow-sm">
            <div className="px-5 py-3 border-b"><div className="h-4 w-40 bg-slate-200 rounded" /></div>
            <div className="p-5"><ChartSkeleton height={380} /></div>
          </div>
          <div className="rounded-xl bg-white shadow-sm">
            <div className="px-5 py-3 border-b"><div className="h-4 w-52 bg-slate-200 rounded" /></div>
            <div className="p-5"><ChartSkeleton height={320} /></div>
          </div>
        </div>
        <div className="rounded-xl bg-white shadow-sm">
          <div className="px-5 py-3 border-b"><div className="h-4 w-28 bg-slate-200 rounded" /></div>
          <div className="p-5"><TableSkeleton rows={5} cols={4} /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* left: scope switch + compare */}
        <div className="flex items-center gap-3">
          <ScopeSwitch value={scope} onChange={setScope} />
        </div>

        {/* center: 회계월 / 회계연도 picker */}
        <div className="md:flex-1 md:flex md:justify-center">
          {scope === "MONTHLY" && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">회계월</label>
              <YearMonthPicker value={ym} onChange={setYm} />
            </div>
          )}
          {scope === "ANNUAL" && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">회계연도</label>
              <YearMonthPicker value={ym} onChange={setYm} yearOnly />
            </div>
          )}
        </div>

        {/* right: refresh */}
        <div className="flex items-center gap-2 md:ml-auto">
          <button
            onClick={load}
            disabled={loading}
            title="새로고침"
            aria-label="새로고침"
            className="group relative inline-flex items-center justify-center h-8 w-8 rounded
                       border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            {loading ? (
              <Spinner />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            )}
            <span className="pointer-events-none absolute top-full mt-1 right-0
                             bg-slate-900 text-white text-[11px] rounded px-2 py-0.5 opacity-0
                             group-hover:opacity-100 transition whitespace-nowrap">
              새로고침
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <Kpi title={`총 직접원가 (KRW) · ${scope === "MONTHLY" ? `${ym.slice(0,4)}년 ${Number(ym.slice(5,7))}월` : `${ym.slice(0,4)}년`}`}
             value={fmt(totalCost)}
             loading={loading}
             sub={comparisonTotals
               ? diffLabel(totalCost, comparisonTotals.cost, scope === "ANNUAL" ? "전년도" : "저번달")
               : fmtShort(totalCost)} />
        <Kpi title={`총 투입공수 (h) · ${scope === "MONTHLY" ? `${ym.slice(0,4)}년 ${Number(ym.slice(5,7))}월` : `${ym.slice(0,4)}년`}`}
             value={fmt(totalHours)}
             loading={loading}
             sub={comparisonTotals
               ? diffLabel(totalHours, comparisonTotals.hours, "이전 기간", "h")
               : undefined} />
        <Kpi title="대상 프로젝트" value={String(byProj.length)}
             loading={loading}
             sub={comparisonTotals
               ? diffLabel(byProj.length, comparisonTotals.projectCount,
                           scope === "ANNUAL" ? "전년도" : "저번달", "개")
               : undefined} />
        <Kpi title="인력수 (명)" value={String(byEmp.length)}
             loading={loading}
             sub={comparisonTotals
               ? diffLabel(byEmp.length, comparisonTotals.employeeCount,
                           scope === "ANNUAL" ? "전년도" : "저번달", "명")
               : "승인된 공수가 있는 직원"} />
        <Kpi title="예산초과 프로젝트" value={String(overBudget)}
             loading={loading}
             sub={comparisonTotals
               ? diffLabel(overBudget, comparisonTotals.overBudget, "이전 기간", "개")
               : (overBudget > 0 ? "경고: 주의 필요" : "정상 범위")} />
      </div>

      <Panel title={`본부별 직접원가 · ${scope === "MONTHLY" ? `${ym.slice(0,4)}년 ${Number(ym.slice(5,7))}월` : `${ym.slice(0,4)}년`}`}
        right={byDept.length > 0 &&
          <ExportPngButton targetRef={barRef} filename={`bar_${ym}_${scope}.png`} />}>
        <div ref={barRef}>
        {loading ? (
          <ChartSkeleton height={300} />
        ) : byDept.length === 0 ? (
          <EmptyState title="본부별 데이터가 없습니다"
                      hint="다른 회계월을 선택하거나 공수를 승인해 보세요." />
        ) : (
        <>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byDept} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
            onClick={(e: any) => { if (e && e.activeLabel) router.push(`/variance`); }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="keyName" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v: any) => fmtShort(v)} width={70} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: any) => `${fmt(Number(v))} KRW`} />
            <Bar dataKey="directCost" fill="#1d4ed8" cursor="pointer" name="직접원가"
                 maxBarSize={60} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="text-xs text-slate-500 mt-2">* 막대 클릭 → 차이분석 페이지로 이동</div>
        </>
        )}
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title={`프로젝트별 원가 비중 · ${scope === "MONTHLY" ? `${ym.slice(0,4)}년 ${Number(ym.slice(5,7))}월` : `${ym.slice(0,4)}년`}`}
          right={byProj.length > 0 &&
            <ExportPngButton targetRef={pieRef} filename={`pie_${ym}_${scope}.png`} />}>
          <div ref={pieRef}>
          {loading ? (
            <ChartSkeleton height={380} />
          ) : byProj.length === 0 ? (
            <EmptyState title="프로젝트 데이터가 없습니다"
                        hint="해당 기간에 승인된 공수가 없습니다." />
          ) : (
          <ResponsiveContainer width="100%" height={380}>
            <PieChart>
              <Pie
                data={[...byProj].sort((a, b) => Number(b.directCost) - Number(a.directCost))}
                dataKey="directCost" nameKey="keyCode"
                outerRadius={110} innerRadius={50}
                paddingAngle={1}
              >
                {byProj.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any, _n: any, p: any) =>
                [`${fmt(Number(v))} KRW`, p?.payload?.keyName || p?.payload?.keyCode]} />
              <Legend verticalAlign="bottom" height={80}
                wrapperStyle={{ maxHeight: 100, overflowY: "auto", fontSize: 11 }}
                formatter={(value: any) => {
                  const proj = byProj.find((p: any) => p.keyCode === value);
                  const full = proj ? `${proj.keyCode} · ${proj.keyName}` : value;
                  return <span title={full} style={{ fontSize: 11, cursor: "help" }}>{value}</span>;
                }} />
            </PieChart>
          </ResponsiveContainer>
          )}
          </div>
        </Panel>

        <Panel title={`예산 대비 차이 추이 · ${scope === "MONTHLY" ? `최근 12개월 (~ ${ym.slice(0,4)}.${Number(ym.slice(5,7))})` : `${ym.slice(0,4)}년 월별`}`}
          right={trend.length > 0 &&
            <ExportPngButton targetRef={trendRef} filename={`variance-trend_${ym}_${scope}.png`} />}>
          <div ref={trendRef}>
          {loading ? (
            <ChartSkeleton height={320} />
          ) : trend.length === 0 ? (
            <EmptyState title="추이 데이터가 없습니다"
                        hint="승인된 공수가 있으면 월별 선이 표시됩니다." />
          ) : (
          <>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trend} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }}
                     angle={0}
                     textAnchor={"middle"}
                     height={30} />
              <YAxis tickFormatter={(v: any) => `${v}%`} width={60} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => `${Number(v).toFixed(1)}%`} />
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3"
                             label={{ value: "예산선 (0%)", position: "insideTopRight",
                                      fill: "#64748b", fontSize: 10 }} />
              <Line type="monotone" dataKey="costVariancePct" stroke="#dc2626"
                    name="차이율 %" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-xs text-slate-500 mt-2">
            * {scope === "MONTHLY"
                ? "선택한 월 기준 과거 12개월의 월별 실적 vs 분기 Phasing 월예산 (Q1 20% · Q2/Q3 30% · Q4 20%)"
                : "선택한 연도의 월별 실적 vs 분기 Phasing 월예산 (Q1 20% · Q2/Q3 30% · Q4 20%)"}
          </div>
          </>
          )}
          </div>
        </Panel>
      </div>

      <Panel title="상세 집계" right={
        <div className="flex items-center gap-3">
          <SearchInput value={drillKeyword} onChange={v => { setDrillKeyword(v); setDrillPage(0); }}
            onRefresh={load} placeholder="코드, 이름 검색..." className="w-72" />
          <div className="flex gap-1">
            {(["DEPARTMENT", "PROJECT", "EMPLOYEE"] as const).map(l => (
              <button key={l}
                onClick={() => setDrillLevel(l)}
                className={`px-3 py-1 rounded text-xs ${drillLevel === l
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {l === "DEPARTMENT" ? "본부" : l === "PROJECT" ? "프로젝트" : "직원"}
              </button>
            ))}
          </div>
          <div className="h-5 w-px bg-slate-200" />
          <button type="button"
            onClick={() => downloadXlsx(
              api.exportAggregateAllUrl(ym, scope),
              `aggregate_${ym}_${scope}.xlsx`
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
        </div>
      }>
        {(() => {
          if (loading) {
            return <TableSkeleton rows={5} cols={4} />;
          }
          const raw = drillLevel === "DEPARTMENT" ? byDept
            : drillLevel === "PROJECT" ? byProj
            : byEmp;
          if (raw.length === 0) {
            return <EmptyState title="데이터가 없습니다"
                               hint="회계 기간을 변경하거나 공수를 승인해 보세요." />;
          }
          const kw = drillKeyword.toLowerCase();
          const filtered = kw
            ? raw.filter((r: any) =>
                (r.keyCode || "").toLowerCase().includes(kw) ||
                (r.keyName || "").toLowerCase().includes(kw))
            : raw;
          const source = filtered.map((r: any) => ({
            ...r,
            avgRate: Number(r.hours) > 0 ? Number(r.directCost) / Number(r.hours) : 0,
          }));
          const sorted = sortRows(source, drillSort);
          const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
          const page = Math.min(drillPage, totalPages - 1);
          const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
          return (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <SortHeader label="코드" sortKey="keyCode" current={drillSort} onSort={s => { setDrillSort(s); setDrillPage(0); }} />
                      <SortHeader label={drillLevel === "EMPLOYEE" ? "직원명" : "이름"} sortKey="keyName" current={drillSort} onSort={s => { setDrillSort(s); setDrillPage(0); }} />
                      <SortHeader label="공수(h)" sortKey="hours" current={drillSort} onSort={s => { setDrillSort(s); setDrillPage(0); }} className="text-right" />
                      <SortHeader label="직접원가" sortKey="directCost" current={drillSort} onSort={s => { setDrillSort(s); setDrillPage(0); }} className="text-right" />
                      {drillLevel === "EMPLOYEE" && <SortHeader label="시간당 단가" sortKey="avgRate" current={drillSort} onSort={s => { setDrillSort(s); setDrillPage(0); }} className="text-right" />}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r: any) => {
                      const avgRate = r.avgRate;
                      const proj = drillLevel === "PROJECT" ? projectsById[r.keyId] : null;
                      const projMeta = proj
                        ? `${r.keyCode} · ${r.keyName}\n기간: ${proj.startDate} ~ ${proj.endDate}`
                        : `${r.keyCode} · ${r.keyName}`;
                      return (
                        <tr key={r.keyId} className="border-b hover:bg-slate-50 cursor-pointer"
                            title={projMeta}
                            onClick={() => drillLevel === "PROJECT" && router.push("/variance")}>
                          <td className="p-2 font-mono">{r.keyCode}</td>
                          <td className="p-2">{r.keyName}</td>
                          <td className="p-2 text-right">{fmt(r.hours)}</td>
                          <td className="p-2 text-right">{fmt(r.directCost)}</td>
                          {drillLevel === "EMPLOYEE" && (
                            <td className="p-2 text-right">{fmt(avgRate)}</td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pager page={page} total={source.length} pageSize={PAGE_SIZE} onChange={setDrillPage} />
            </>
          );
        })()}
      </Panel>
    </div>
  );
}

/** Friendly "+X (+Y%) vs 전년도/저번달" sub-label. Handles zero/NaN safely. */
function diffLabel(current: number, prev: number, who: string, unit = "") {
  const cur = Number.isFinite(current) ? current : 0;
  const pre = Number.isFinite(prev) ? prev : 0;
  if (cur === 0 && pre === 0) return `${who} 데이터 없음`;
  const diff = cur - pre;
  if (diff === 0) return `${who}과 동일`;
  const sign = diff > 0 ? "+" : "−";
  const absDiff = Math.abs(diff);
  // No % when previous is 0 (would be infinite / NaN).
  if (pre === 0) return `${sign}${fmt(absDiff)}${unit} (신규) vs ${who}`;
  const pct = (absDiff / pre) * 100;
  return `${sign}${fmt(absDiff)}${unit} (${sign}${pct.toFixed(1)}%) vs ${who}`;
}

/** Return the previous period for a given ym and scope. */
function shiftPeriod(ym: string, scope: "MONTHLY" | "ANNUAL"): string {
  const [y, m] = ym.split("-").map(Number);
  if (scope === "ANNUAL") return `${y - 1}-${String(m || 1).padStart(2, "0")}`;
  let py = y, pm = (m || 1) - 1;
  if (pm < 1) { py -= 1; pm = 12; }
  return `${py}-${String(pm).padStart(2, "0")}`;
}
