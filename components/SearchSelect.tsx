"use client";

import { useEffect, useRef, useState } from "react";

export interface SearchSelectOption {
  value: string;
  label: string;
}

interface Props {
  options: SearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchSelect({ options, value, onChange, placeholder = "검색..." }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleOpen() {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleOpen}
        className="border rounded px-3 py-1.5 text-sm w-full bg-white text-left flex items-center justify-between gap-2 hover:border-slate-400 transition"
      >
        <span className={selected ? "text-slate-900 truncate" : "text-slate-400 truncate"}>
          {selected ? selected.label : "선택"}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-slate-400 flex-shrink-0">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-72 flex flex-col overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full border rounded px-2.5 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          {/* Options list */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-slate-400 text-center">결과 없음</div>
            ) : (
              filtered.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleSelect(o.value)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition flex items-center gap-2 ${
                    o.value === value ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700"
                  }`}
                >
                  {o.value === value && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="flex-shrink-0">
                      <path d="M11.2 3.5L5.6 9.8L2.8 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <span className="truncate">{o.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
