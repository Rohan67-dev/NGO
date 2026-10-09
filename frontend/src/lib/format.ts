/** Formats rupees with Indian digit grouping, e.g. 125000 -> "₹1,25,000.00". */
export const formatINR = (value: number | null | undefined, fractionDigits = 2): string => {
  const n = Number(value ?? 0);
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
};

/** Effective selling price: the discount price when it is set and lower than the list price. */
export const effectivePrice = (p: { price: number; discountPrice?: number | null }): number =>
  p.discountPrice != null && p.discountPrice < p.price ? p.discountPrice : p.price;

export const hasDiscount = (p: { price: number; discountPrice?: number | null }): boolean =>
  p.discountPrice != null && p.discountPrice < p.price;

/**
 * Only allow same-site relative redirects (prevents ?redirect=https://evil.example open redirects).
 */
export const safeRedirect = (target: string | null | undefined, fallback = '/'): string => {
  if (!target) return fallback;
  if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) return fallback;
  return target;
};

export const formatDate = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const humanize = (s: string): string =>
  s.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect width='400' height='400' fill='%23f1f5f9'/><text x='200' y='205' font-family='sans-serif' font-size='18' fill='%2394a3b8' text-anchor='middle'>No image available</text></svg>";
