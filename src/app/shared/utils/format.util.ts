/**
 * Local calendar date as `YYYY-MM-DD`.
 * Use this instead of `new Date().toISOString().slice(0, 10)`, which is the UTC date and is a
 * day off for users east of UTC (e.g. India) for the first hours after midnight.
 */
export function toLocalDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Indian-rupee amount, e.g. `₹1,500` / `₹499.50`. Null/undefined/NaN show as `₹0`.
 * `fixedDecimals` forces a fixed number of decimals (e.g. 2 for prices).
 */
export function formatInr(value: number | string | null | undefined, fixedDecimals?: number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  const amount = n == null || Number.isNaN(n) ? 0 : n;
  const min = fixedDecimals ?? 0;
  const max = fixedDecimals ?? 2;
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: min, maximumFractionDigits: max })}`;
}
