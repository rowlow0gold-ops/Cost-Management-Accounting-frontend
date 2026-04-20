"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { Panel, Button, Input, Select, Badge, Spinner } from "@/components/ui";
import YearMonthPicker from "@/components/YearMonthPicker";
import { toast } from "@/components/Toast";

export default function AllocationPage() {
  const [ym, setYm] = useState("2026-01");
  const [basis, setBasis] = useState<"HOURS" | "HEADCOUNT" | "REVENUE">("HOURS");
  const [result, setResult] = useState<any[]>([]);
  const [costItems, setCostItems] = useState<any[]>([]);
  const [running, setRunning] = useState(false);

  async function loadCostItems() {
    try { setCostItems(await api.costItems(ym)); } catch {}
  }
  useEffect(() => { loadCostItems(); /* eslint-disable-next-line */ }, [ym]);

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

  const totalIndirect = costItems.reduce((s, x) => s + Number(x.amount ?? 0), 0);
  const totalAllocated = result.reduce((s, x) => s + Number(x.amount ?? 0), 0);

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

      <Panel title={`해당월 간접비 (총 ${fmt(totalIndirect)} KRW)`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-2">본부</th>
                <th className="p-2">유형</th>
                <th className="p-2">항목</th>
                <th className="p-2 text-right">금액</th>
              </tr>
            </thead>
            <tbody>
              {costItems.map((c: any) => (
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
      </Panel>

      <Panel title={`배분 결과 (총 배분액 ${fmt(totalAllocated)} KRW)`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-2">출처 본부</th>
                <th className="p-2">대상 프로젝트</th>
                <th className="p-2">배부기준</th>
                <th className="p-2 text-right">배분액</th>
              </tr>
            </thead>
            <tbody>
              {result.map((r: any) => (
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
      </Panel>
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
