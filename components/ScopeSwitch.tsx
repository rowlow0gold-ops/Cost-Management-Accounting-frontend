"use client";

import { useEffect, useRef, useState } from "react";

export type Scope = "MONTHLY" | "ANNUAL";

const LABELS: Record<Scope, string> = {
  MONTHLY: "월별",
  ANNUAL: "연간",
};

/**
 * Dropdown that shows only the active scope label.
 * Clicking toggles a menu with the other options.
 */
export default function ScopeSwitch({
  value, onChange,
}: {
  value: Scope;
  onChange: (s: Scope) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs
                   text-slate-700 hover:bg-slate-50">
        <span className="font-medium">{LABELS[value]}</span>
        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-slate-400">
          <path d="M5.5 7.5l4.5 5 4.5-5z" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 mt-1 z-30 w-28 rounded-md border bg-white shadow-lg py-1">
          {(Object.keys(LABELS) as Scope[]).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange(s); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs ${
                value === s
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-slate-700 hover:bg-slate-50"
              }`}>
              {LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
