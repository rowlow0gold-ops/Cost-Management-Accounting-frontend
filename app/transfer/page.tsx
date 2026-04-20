"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { Panel, Button, Input, Select, Badge, ErrMsg } from "@/components/ui";
import YearMonthPicker from "@/components/YearMonthPicker";
import { collect, required, positive, differs, Errors } from "@/lib/validate";
import { toast } from "@/components/Toast";

export default function TransferPage() {
  const [depts, setDepts] = useState<any[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [form, setForm] = useState({
    yearMonth: "2026-01",
    sourceDepartmentId: "",
    targetDepartmentId: "",
    hours: "0",
    hourlyRate: "70000",
    memo: "",
  });

  useEffect(() => { api.departments().then(setDepts); }, []);

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
      const r = await api.transfer({
        yearMonth: form.yearMonth,
        sourceDepartmentId: Number(form.sourceDepartmentId),
        targetDepartmentId: Number(form.targetDepartmentId),
        hours: Number(form.hours),
        hourlyRate: Number(form.hourlyRate),
        memo: form.memo,
      });
      toast.success(`내부대체가액 기록 완료: ${fmt(r.amount)} KRW`);
    } catch (e) { toast.fromError(e); }
  }

  const amount = Number(form.hours || 0) * Number(form.hourlyRate || 0);

  return (
    <div className="space-y-6">
      <Panel title="내부대체가액 기록 (Internal Transfer Pricing)">
        <p className="text-sm text-slate-600 mb-4">
          본부 간 서비스 제공의 원가 귀속을 재조정합니다. 제공 본부의 비용은 감소하고
          수혜 본부의 비용은 증가합니다. 시간당 단가 × 공수가 대체가액이 됩니다.
        </p>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="회계월">
            <Input type="month" required value={form.yearMonth}
              onChange={e => setForm({ ...form, yearMonth: e.target.value })} />
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
          <div className="col-span-full">
            <Button type="submit">기록</Button>
          </div>
        </form>
      </Panel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel title="개념">
          <ul className="text-sm text-slate-700 list-disc pl-5 space-y-2">
            <li><b>내부대체가액</b>은 본부 간 서비스 제공에 대한 <b>사내 이전가격</b>입니다.</li>
            <li>제공 본부는 원가를 수혜 본부에 넘겨주고, 본부별 실질 원가가 반영됩니다.</li>
            <li>배부기준은 <b>HOURS</b>(공수 기반)으로 고정되며, 단가는 협의 단가(시간당 KRW)를 사용합니다.</li>
          </ul>
        </Panel>
        <Panel title="예시">
          <div className="text-sm text-slate-700 space-y-2">
            <p><b>사례:</b> IT본부가 리스크관리본부에 개발 인력 <b>40시간</b>을 지원.</p>
            <p className="font-mono bg-slate-50 p-3 rounded border text-xs">
              시간당 70,000 KRW × 40 h = <b>2,800,000 KRW</b>
            </p>
            <p>→ IT본부 원가 2.8M 감소, 리스크관리본부 원가 2.8M 증가로 성과가 재조정됩니다.</p>
          </div>
        </Panel>
      </div>
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
