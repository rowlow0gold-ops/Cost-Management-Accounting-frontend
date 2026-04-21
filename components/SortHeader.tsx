"use client";

export type SortDir = "asc" | "desc";
export type SortState = { key: string; dir: SortDir };

export function sortRows<T>(rows: T[], sort: SortState | null): T[] {
  if (!sort) return rows;
  return [...rows].sort((a: any, b: any) => {
    let va = a[sort.key] ?? a[sort.key.split(".").reduce((o: any, k: string) => o?.[k], a)];
    let vb = b[sort.key] ?? b[sort.key.split(".").reduce((o: any, k: string) => o?.[k], b)];
    // resolve nested keys like "employee.name"
    if (sort.key.includes(".")) {
      va = sort.key.split(".").reduce((o: any, k: string) => o?.[k], a);
      vb = sort.key.split(".").reduce((o: any, k: string) => o?.[k], b);
    }
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    const na = Number(va), nb = Number(vb);
    if (!isNaN(na) && !isNaN(nb)) {
      return sort.dir === "asc" ? na - nb : nb - na;
    }
    const sa = String(va).toLowerCase(), sb = String(vb).toLowerCase();
    const cmp = sa.localeCompare(sb);
    return sort.dir === "asc" ? cmp : -cmp;
  });
}

export function toggleSort(current: SortState | null, key: string): SortState {
  if (current?.key === key) {
    return { key, dir: current.dir === "asc" ? "desc" : "asc" };
  }
  return { key, dir: "asc" };
}

export default function SortHeader({
  label, sortKey, current, onSort, className,
}: {
  label: string;
  sortKey: string;
  current: SortState | null;
  onSort: (s: SortState) => void;
  className?: string;
}) {
  const active = current?.key === sortKey;
  return (
    <th
      className={`p-2 cursor-pointer select-none hover:bg-slate-100 ${className || ""}`}
      onClick={() => onSort(toggleSort(current, sortKey))}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={`text-[10px] leading-none ${active ? "text-blue-600" : "text-slate-300"}`}>
          {active && current?.dir === "asc" ? "▲" : active && current?.dir === "desc" ? "▼" : "⇅"}
        </span>
      </span>
    </th>
  );
}
