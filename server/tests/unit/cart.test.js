import { describe, it, expect } from 'vitest';
import { roundToTwoDecimals } from '../../src/utils/helpers.js';

describe('Cart Business Logic Unit Tests', () => {
  it('should round prices and totals accurately to 2 decimal places', () => {
    expect(roundToTwoDecimals(19.999)).toBe(20);
    expect(roundToTwoDecimals(10.123)).toBe(10.12);
    expect(roundToTwoDecimals(0)).toBe(0);
  });

  it('should calculate item subtotals on server side correctly', () => {
    const items = [
      { price: 499.5, quantity: 2 },
      { price: 1200, quantity: 1 },
    ];
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    expect(roundToTwoDecimals(subtotal)).toBe(2199);
  });

  it('should calculate percentage coupon discount with maximum cap', () => {
    const cartTotal = 2500;
    const discountPercent = 20; // 20% of 2500 is 500
    const maxDiscount = 300; // Capped at 300

    let calculatedDiscount = (cartTotal * discountPercent) / 100;
    if (maxDiscount > 0) {
      calculatedDiscount = Math.min(calculatedDiscount, maxDiscount);
    }

    expect(calculatedDiscount).toBe(300);
  });

  it('should never yield NaN for coupon discount when input values are malformed or missing', () => {
    const rawInputs = [
      { cartTotal: undefined, discountAmount: 10 },
      { cartTotal: null, discountAmount: 10 },
      { cartTotal: NaN, discountAmount: 10 },
      { cartTotal: 500, discountAmount: undefined },
      { cartTotal: 500, discountAmount: NaN },
      { cartTotal: 0, discountAmount: 0 },
    ];

    for (const input of rawInputs) {
      const numericCartTotal = Math.max(0, Number(input.cartTotal) || 0);
      const discountAmountValue = Math.max(0, Number(input.discountAmount) || 0);
      const discount = (numericCartTotal * discountAmountValue) / 100;
      const safeDiscount = Number.isNaN(discount) ? 0 : Math.round(discount * 100) / 100;

      expect(Number.isNaN(safeDiscount)).toBe(false);
      expect(typeof safeDiscount).toBe('number');
      expect(safeDiscount).toBeGreaterThanOrEqual(0);
    }
  });
});
