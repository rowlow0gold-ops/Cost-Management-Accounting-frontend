import { ReactNode } from "react";

type Props = {
  title?: string;
  hint?: ReactNode;
  className?: string;
};

/** Inline empty-state with a simple SVG illustration. */
export function EmptyState({ title = "데이터가 없습니다", hint, className }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center py-10 text-slate-400 ${className || ""}`}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none"
           xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="10" y="14" width="44" height="36" rx="3"
              stroke="currentColor" strokeWidth="2" />
        <path d="M10 22h44" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="18" r="1.2" fill="currentColor" />
        <circle cx="20" cy="18" r="1.2" fill="currentColor" />
        <path d="M18 32l28 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M18 38l20 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M18 44l14 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="48" cy="46" r="6" stroke="#94a3b8" strokeWidth="2" />
        <path d="M52 50l4 4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="mt-3 text-sm font-medium">{title}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}
