import { VendorPayout } from '../../models/VendorPayout.model.js';
import { VendorEarnings } from '../../models/VendorEarnings.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';

export class VendorPayoutService {
  async getVendorId(userId) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw ApiError.notFound('Vendor profile not found');
    return vendor._id;
  }

  async getPayouts(userId, params = {}) {
    const vendorId = await this.getVendorId(userId);
    const { page, limit, skip } = parsePagination(params);

    const [payouts, total] = await Promise.all([
      VendorPayout.find({ vendorId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      VendorPayout.countDocuments({ vendorId }),
    ]);

    return {
      payouts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPayoutById(userId, payoutId) {
    const vendorId = await this.getVendorId(userId);
    const payout = await VendorPayout.findOne({ _id: payoutId, vendorId });
    if (!payout) throw ApiError.notFound('Payout record not found');
    return payout;
  }

  async requestPayout(userId, { amount, notes = '' }) {
    const vendorId = await this.getVendorId(userId);
    const earnings = await VendorEarnings.findOne({ vendorId });

    if (!earnings || earnings.availableBalance < Number(amount)) {
      throw ApiError.badRequest(
        `Insufficient available balance. Available: ₹${earnings?.availableBalance || 0}`
      );
    }

    const payout = await VendorPayout.create({
      vendorId,
      amount: Number(amount),
      status: 'PENDING',
      notes,
    });

    earnings.availableBalance -= Number(amount);
    earnings.pendingBalance += Number(amount);
    await earnings.save();

    return payout;
  }
}

export const vendorPayoutService = new VendorPayoutService();
export default vendorPayoutService;
