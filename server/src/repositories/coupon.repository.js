import { BaseRepository } from './base.repository.js';
import { Coupon } from '../models/Coupon.model.js';

export class CouponRepository extends BaseRepository {
  constructor() {
    super(Coupon);
  }

  async findByCode(code) {
    return this.model.findOne({ code: code.toUpperCase() });
  }

  async findValidCoupon(code) {
    const now = new Date();
    return this.model.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: now },
      expiryDate: { $gte: now },
    });
  }
}

export const couponRepository = new CouponRepository();
export default couponRepository;
