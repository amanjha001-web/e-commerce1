import { VendorPayout } from '../../models/VendorPayout.model.js';
import { VendorEarnings } from '../../models/VendorEarnings.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';

export class VendorPayoutService {
  async getVendorProfile(userId) {
    const vendor = await Vendor.findOne({ $or: [{ userId }, { user: userId }] });
    if (!vendor) throw ApiError.notFound('Vendor profile not found');
    return vendor;
  }

  async getVendorId(userId) {
    const vendor = await this.getVendorProfile(userId);
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
    const vendor = await this.getVendorProfile(userId);
    const vendorId = vendor._id;
    const requestedAmount = Number(amount);

    if (!Number.isFinite(requestedAmount) || requestedAmount < 1) {
      throw ApiError.badRequest('Payout amount must be at least ₹1');
    }

    const earnings = await VendorEarnings.findOne({ vendorId });

    if (!earnings || earnings.availableBalance < requestedAmount) {
      throw ApiError.badRequest(
        `Insufficient available balance. Available: ₹${earnings?.availableBalance || 0}`
      );
    }

    const bankDetails = vendor.businessDetails?.bankAccount || vendor.bankDetails || {};
    const payout = await VendorPayout.create({
      vendorId,
      amount: requestedAmount,
      status: 'PENDING',
      bankDetails: {
        accountHolderName: bankDetails.accountHolderName || '',
        accountNumber: bankDetails.accountNumber || '',
        bankName: bankDetails.bankName || '',
        ifscCode: bankDetails.ifscCode || '',
      },
      notes: String(notes || '').trim(),
    });

    earnings.availableBalance -= requestedAmount;
    earnings.pendingBalance += requestedAmount;
    await earnings.save();

    return payout;
  }
}

export const vendorPayoutService = new VendorPayoutService();
export default vendorPayoutService;
