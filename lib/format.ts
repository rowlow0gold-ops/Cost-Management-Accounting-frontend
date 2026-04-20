export const fmt = (n: number | string) =>
  new Intl.NumberFormat("ko-KR").format(Math.round(Number(n || 0)));

export const fmtPct = (n: number | string, digits = 1) =>
  `${Number(n || 0).toFixed(digits)}%`;

/** Short form for chart axes: 12.3M, 4.5K, 1.2억 */
export const fmtShort = (n: number | string) => {
  const v = Number(n || 0);
  const abs = Math.abs(v);
  if (abs >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`;
  if (abs >= 10_000)       return `${(v / 10_000).toFixed(0)}만`;
  if (abs >= 1_000)        return `${(v / 1_000).toFixed(1)}K`;
  return String(Math.round(v));
};
