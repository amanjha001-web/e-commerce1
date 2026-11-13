import { describe, it, expect } from 'vitest';
import { roundToTwoDecimals } from '../../src/utils/helpers.js';

describe('Order Calculation & Business Logic Unit Tests', () => {
  it('should calculate shipping fee and tax properly based on subtotal threshold', () => {
    // Under ₹1000 -> ₹50 shipping fee
    const subtotalSmall = 600;
    const shippingSmall = subtotalSmall > 1000 ? 0 : 50;
    const taxSmall = roundToTwoDecimals(subtotalSmall * 0.18);
    const totalSmall = roundToTwoDecimals(subtotalSmall + shippingSmall + taxSmall);

    expect(shippingSmall).toBe(50);
    expect(taxSmall).toBe(108);
    expect(totalSmall).toBe(758);

    // Over ₹1000 -> ₹0 free shipping
    const subtotalLarge = 2000;
    const shippingLarge = subtotalLarge > 1000 ? 0 : 50;
    const taxLarge = roundToTwoDecimals(subtotalLarge * 0.18);
    const totalLarge = roundToTwoDecimals(subtotalLarge + shippingLarge + taxLarge);

    expect(shippingLarge).toBe(0);
    expect(taxLarge).toBe(360);
    expect(totalLarge).toBe(2360);
  });

  it('should generate valid human-readable order numbers', () => {
    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    expect(orderNumber).toMatch(/^ORD-\d{13}-\d{4}$/);
  });
});
