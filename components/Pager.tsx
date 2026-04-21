"use client";

export default function Pager({ page, total, pageSize, onChange }: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between px-2 pt-3 text-xs text-slate-500">
      <span>총 {total}건</span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button disabled={page === 0} onClick={() => onChange(page - 1)}
            className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed">
            ← 이전
          </button>
          <span className="px-2">{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}
            className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed">
            다음 →
          </button>
        </div>
      )}
    </div>
  );
}
