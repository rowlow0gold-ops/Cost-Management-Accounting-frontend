"use client";

export type Scope = "ANNUAL";

export default function ScopeSwitch({
  value, onChange,
}: {
  value: Scope;
  onChange: (s: Scope) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-md border bg-white px-3 py-1.5 text-xs text-slate-700">
      <span className="font-medium">연간</span>
    </div>
  );
}
