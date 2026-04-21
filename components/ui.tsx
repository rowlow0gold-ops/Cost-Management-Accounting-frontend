import clsx from "clsx";
import { ReactNode } from "react";

export function Panel({ title, right, children, className }:
  { title?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-xl bg-white shadow-sm", className)}>
      {(title || right) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 md:px-5 py-3 border-b">
          {title && <h3 className="font-semibold text-sm">{title}</h3>}
          {right}
        </div>
      )}
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

export function Kpi({ title, value, sub, loading }:
  { title: string; value: string; sub?: string; loading?: boolean }) {
  return (
    <div className="rounded-xl bg-white p-4 md:p-5 shadow-sm">
      <div className="text-xs text-slate-500 truncate">{title}</div>
      {loading ? (
        <div className="animate-pulse mt-1 space-y-2">
          <div className="h-6 w-28 bg-slate-200 rounded" />
          <div className="h-3 w-36 bg-slate-200 rounded" />
        </div>
      ) : (
        <>
          <div className="mt-1 text-lg md:text-2xl font-bold break-all">{value}</div>
          {sub && <div className="text-xs text-slate-500 mt-1 truncate">{sub}</div>}
        </>
      )}
    </div>
  );
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const { variant = "primary", className, ...rest } = props;
  return (
    <button
      {...rest}
      className={clsx(
        "px-3 py-1.5 rounded text-sm font-medium transition disabled:opacity-50",
        variant === "primary" && "bg-brand-600 text-white hover:bg-brand-700",
        variant === "ghost" && "bg-slate-100 text-slate-700 hover:bg-slate-200",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className
      )}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest}
    className={clsx("border rounded px-3 py-1.5 text-sm w-full", className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return <select {...rest}
    className={clsx("border rounded px-3 py-1.5 text-sm w-full bg-white", className)} />;
}

export function ErrMsg({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <div className="text-xs text-red-600 mt-1">{children}</div>;
}

/** Small inline spinner. */
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-slate-300 border-t-brand-600"
      style={{ width: size, height: size }}
      aria-label="로딩 중"
    />
  );
}

/** Full-panel loading overlay. */
export function LoadingOverlay({ label = "불러오는 중..." }: { label?: string }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-xl">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Spinner size={20} /> {label}
      </div>
    </div>
  );
}

/** Content-area skeleton block (use while data is loading). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className || "h-4 w-full"}`} />;
}

/** Skeleton for a table with N rows and M columns. */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      <div className="flex gap-4 px-2 py-3 border-b bg-slate-50">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-200 rounded" style={{ width: `${60 + (i % 3) * 20}px` }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-2 py-3.5 border-b">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3 bg-slate-200 rounded" style={{ width: `${50 + ((r + c) % 4) * 15}px` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a chart area. */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="animate-pulse flex items-end gap-3 px-8 pb-8 pt-4" style={{ height }}>
      {[40, 65, 30, 80, 55, 45, 70, 35].map((h, i) => (
        <div key={i} className="bg-slate-200 rounded-t flex-1" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

/** Full-page skeleton for form + table layout. */
export function PageSkeleton({ formRows = 1, tableRows = 5, tableCols = 5 }: { formRows?: number; tableRows?: number; tableCols?: number }) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-xl bg-white shadow-sm p-5">
        <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: formRows * 4 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-16 bg-slate-200 rounded mb-2" />
              <div className="h-8 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-white shadow-sm p-5">
        <div className="h-4 w-40 bg-slate-200 rounded mb-4" />
        <TableSkeleton rows={tableRows} cols={tableCols} />
      </div>
    </div>
  );
}

export function Badge({ tone = "slate", children }:
  { tone?: "slate" | "green" | "yellow" | "red" | "blue"; children: ReactNode }) {
  const map = {
    slate:  "bg-slate-100 text-slate-700",
    green:  "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-800",
    red:    "bg-red-100 text-red-700",
    blue:   "bg-blue-100 text-blue-700",
  };
  return <span className={clsx("px-2 py-0.5 rounded text-xs font-medium", map[tone])}>{children}</span>;
}
