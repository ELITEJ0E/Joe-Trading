/**
 * Ultra-safe Number and Currency Formatters
 * Guaranteed never to throw TypeError: Cannot read properties of undefined (reading 'toLocaleString')
 */

export function safeNumber(val: any, fallback: number = 0): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) return parsed;
  }
  return fallback;
}

export function formatNumber(
  val: number | string | null | undefined,
  options?: Intl.NumberFormatOptions,
  fallback: string = '0'
): string {
  if (val === null || val === undefined) return fallback;
  const num = safeNumber(val, NaN);
  if (isNaN(num)) return fallback;
  try {
    return num.toLocaleString(undefined, options);
  } catch {
    return String(num);
  }
}

export function formatCurrency(
  val: number | string | null | undefined,
  decimals: number = 2,
  showSign: boolean = false
): string {
  if (val === null || val === undefined) return '$0.00';
  const num = safeNumber(val, 0);
  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const sign = showSign && num > 0 ? '+' : '';
  return `${sign}$${formatted}`;
}

export function formatInteger(val: number | string | null | undefined, fallback: string = '0'): string {
  return formatNumber(val, { maximumFractionDigits: 0 }, fallback);
}

export function formatPercent(val: number | string | null | undefined, decimals: number = 2): string {
  if (val === null || val === undefined) return '0.00%';
  const num = safeNumber(val, 0);
  return `${num >= 0 ? '+' : ''}${num.toFixed(decimals)}%`;
}
