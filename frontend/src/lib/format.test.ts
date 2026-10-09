import { effectivePrice, formatINR, hasDiscount, humanize, safeRedirect } from './format';

describe('format helpers', () => {
  it('formats rupees with Indian grouping', () => {
    expect(formatINR(125000)).toBe('₹1,25,000.00');
    expect(formatINR(599, 0)).toBe('₹599');
    expect(formatINR(null)).toBe('₹0.00');
  });

  it('uses the discount price only when it is lower than the list price', () => {
    expect(effectivePrice({ price: 799, discountPrice: 599 })).toBe(599);
    expect(effectivePrice({ price: 799, discountPrice: null })).toBe(799);
    expect(effectivePrice({ price: 799, discountPrice: 900 })).toBe(799);
    expect(hasDiscount({ price: 799, discountPrice: 599 })).toBe(true);
    expect(hasDiscount({ price: 799 })).toBe(false);
  });

  it('only allows same-site redirects', () => {
    expect(safeRedirect('/checkout')).toBe('/checkout');
    expect(safeRedirect('/shop?query=a')).toBe('/shop?query=a');
    expect(safeRedirect('https://evil.example')).toBe('/');
    expect(safeRedirect('//evil.example')).toBe('/');
    expect(safeRedirect('/\\evil.example')).toBe('/');
    expect(safeRedirect(null, '/home')).toBe('/home');
  });

  it('humanizes enum values', () => {
    expect(humanize('OUT_FOR_DELIVERY')).toBe('Out For Delivery');
  });
});
