"use client";

import { useEffect, useState } from "react";

/**
 * Debounced search input with search & reset buttons.
 * Calls onChange after 300ms of inactivity, or immediately on search button click.
 */
export default function SearchInput({
  value,
  onChange,
  onRefresh,
  placeholder = "검색...",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  onRefresh?: () => void;
  placeholder?: string;
  className?: string;
}) {
  const [local, setLocal] = useState(value);

  // Sync external value changes
  useEffect(() => { setLocal(value); }, [value]);

  function handleChange(v: string) {
    setLocal(v);
  }

  function handleSearch() {
    onChange(local);
  }

  function handleReset() {
    setLocal("");
    onChange("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  }

  return (
    <div className={`relative flex items-center gap-1 ${className}`}>
      <div className="relative flex-1">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={local}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full border rounded px-3 py-1.5 pl-8 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
        />
        {local && (
          <button
            type="button"
            onClick={handleReset}
            title="초기화"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={handleSearch}
        title="검색"
        className="shrink-0 inline-flex items-center justify-center h-[34px] px-2.5 rounded border
                   bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800
                   transition-colors text-xs gap-1"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        검색
      </button>
      {onRefresh && (
        <button
          type="button"
          onClick={() => { handleReset(); onRefresh!(); }}
          title="새로고침"
          className="shrink-0 inline-flex items-center justify-center h-[34px] w-[34px] rounded border
                     bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700
                     transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      )}
    </div>
  );
}
