export type Errors = Record<string, string>;

export function required(v: unknown, msg = "필수 항목입니다"): string | null {
  if (v === null || v === undefined) return msg;
  if (typeof v === "string" && v.trim() === "") return msg;
  return null;
}

export function positive(v: unknown, msg = "0보다 큰 값이어야 합니다"): string | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return msg;
  return null;
}

export function nonNegative(v: unknown, msg = "0 이상이어야 합니다"): string | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return msg;
  return null;
}

export function max(v: unknown, limit: number, msg?: string): string | null {
  const n = Number(v);
  if (Number.isFinite(n) && n > limit) return msg || `${limit} 이하이어야 합니다`;
  return null;
}

export function notFuture(v: string, msg = "미래 날짜는 입력할 수 없습니다"): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return "날짜 형식이 올바르지 않습니다";
  const today = new Date(); today.setHours(23, 59, 59, 999);
  if (d.getTime() > today.getTime()) return msg;
  return null;
}

export function differs(a: unknown, b: unknown, msg = "값이 같을 수 없습니다"): string | null {
  if (a && b && String(a) === String(b)) return msg;
  return null;
}

export function email(v: string, msg = "이메일 형식이 올바르지 않습니다"): string | null {
  if (!v) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return msg;
  return null;
}

/** Helper to build an errors map from a list of [field, error|null] tuples. */
export function collect(pairs: [string, string | null][]): Errors {
  const out: Errors = {};
  for (const [k, v] of pairs) if (v) out[k] = v;
  return out;
}
