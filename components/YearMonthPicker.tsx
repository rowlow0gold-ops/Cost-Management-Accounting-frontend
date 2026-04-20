"use client";

import { useMemo } from "react";

type Props = {
  value: string;                // "2026-04"
  onChange: (v: string) => void;
  yearRange?: [number, number]; // inclusive
  yearOnly?: boolean;           // hide month dropdown and month-shift buttons
};

/**
 * Year + Month picker that lets users select any year/month explicitly.
 * Replaces <input type="month"> when we want clearer multi-year support.
 */
export default function YearMonthPicker({ value, onChange, yearRange, yearOnly }: Props) {
  // Default: show years that have seed data (2025 and 2026).
  const [fromY, toY] = yearRange ?? [2025, 2026];

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = toY; y >= fromY; y--) arr.push(y);
    return arr;
  }, [fromY, toY]);

  const [y, m] = (value || "").split("-");
  const year = Number(y) || fromY;
  const month = Number(m) || 1;

  function change(nextYear: number, nextMonth: number) {
    onChange(`${nextYear}-${String(nextMonth).padStart(2, "0")}`);
  }

  function shift(delta: number) {
    let ny = year;
    let nm = month + delta;
    if (nm < 1) { ny -= 1; nm = 12; }
    if (nm > 12) { ny += 1; nm = 1; }
    if (ny < fromY) return;
    if (ny > toY)   return;
    change(ny, nm);
  }

  const atMin = year === fromY && month === 1;
  const atMax = year === toY && month === 12;

  const btn = "h-8 w-8 flex items-center justify-center rounded border bg-white " +
              "hover:bg-slate-50 text-slate-600 text-base leading-none";

  if (yearOnly) {
    return (
      <div className="flex items-center gap-2">
        <button type="button" className={btn} disabled={year <= fromY}
                onClick={() => change(Math.max(fromY, year - 1), 1)} aria-label="이전 년도">‹</button>
        <select className="border rounded px-2 py-1.5 text-sm bg-white"
                value={year} onChange={e => change(Number(e.target.value), 1)}>
          {years.map(yv => <option key={yv} value={yv}>{yv}년</option>)}
        </select>
        <button type="button" className={btn} disabled={year >= toY}
                onClick={() => change(Math.min(toY, year + 1), 1)} aria-label="다음 년도">›</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" className={btn} disabled={atMin}
              onClick={() => shift(-1)} aria-label="이전 달">‹</button>
      <select className="border rounded px-2 py-1.5 text-sm bg-white"
              value={year} onChange={e => change(Number(e.target.value), month)}>
        {years.map(yv => <option key={yv} value={yv}>{yv}년</option>)}
      </select>
      <select className="border rounded px-2 py-1.5 text-sm bg-white"
              value={month} onChange={e => change(year, Number(e.target.value))}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(mv =>
          <option key={mv} value={mv}>{mv}월</option>
        )}
      </select>
      <button type="button" className={btn} disabled={atMax}
              onClick={() => shift(1)} aria-label="다음 달">›</button>
    </div>
  );
}
