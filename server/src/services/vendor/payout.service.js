import mongoose from 'mongoose';
import { VendorPayout } from '../../models/VendorPayout.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { vendorEarningsService } from './earnings.service.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizePayoutStatus = (raw) => {
  const clean = String(raw || '').trim().toUpperCase();
  if (!clean || clean === 'ALL' || clean === 'ALL PAYOUTS') return '';
  if (clean === 'FAILED') return 'REJECTED';
  if (['PENDING', 'PROCESSING', 'PAID', 'REJECTED', 'CANCELLED'].includes(clean)) {
    return clean;
  }
  return clean;
};

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

    const filter = { vendorId };
    const statusFilter = normalizePayoutStatus(params.status);
    if (statusFilter) {
      filter.status = statusFilter;
    }

    if (params.search && String(params.search).trim()) {
      const searchText = String(params.search).trim();
      const regex = new RegExp(escapeRegex(searchText), 'i');
      const orClauses = [
        { transactionReference: regex },
        { notes: regex },
        { 'bankDetails.bankName': regex },
      ];
      if (mongoose.Types.ObjectId.isValid(searchText)) {
        orClauses.push({ _id: searchText });
      }
      filter.$or = orClauses;
    }

    const [payouts, total] = await Promise.all([
      VendorPayout.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      VendorPayout.countDocuments(filter),
    ]);

    return {
      payouts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getPayoutById(userId, payoutId) {
    const vendorId = await this.getVendorId(userId);
    const payout = await VendorPayout.findOne({ _id: payoutId, vendorId });
    if (!payout) throw ApiError.notFound('Payout record not found');
    return payout;
  }

  async requestPayout(userId, { amount, notes = '', paymentMethod = 'BANK_TRANSFER' }) {
    const requestedAmount = Number(amount);

    if (!Number.isFinite(requestedAmount) || requestedAmount < 1) {
      throw ApiError.badRequest('Payout amount must be at least ₹1');
    }

    const { vendor, earnings } = await vendorEarningsService.ensureSyncedEarnings(userId);
    const vendorId = vendor._id;

    if (!earnings || Number(earnings.availableBalance || 0) < requestedAmount) {
      throw ApiError.badRequest(
        `Insufficient available balance. Available: ₹${earnings?.availableBalance || 0}`
      );
    }

    const bankDetails = vendor.businessDetails?.bankAccount || vendor.bankDetails || {};
    const payout = await VendorPayout.create({
      vendorId,
      amount: Math.round(requestedAmount * 100) / 100,
      paymentMethod: String(paymentMethod || 'BANK_TRANSFER').toUpperCase(),
      status: 'PENDING',
      bankDetails: {
        accountHolderName: bankDetails.accountHolderName || '',
        accountNumber: bankDetails.accountNumber || '',
        bankName: bankDetails.bankName || '',
        ifscCode: bankDetails.ifscCode || '',
      },
      notes: String(notes || '').trim(),
    });

    earnings.availableBalance = Math.max(
      0,
      Math.round((Number(earnings.availableBalance || 0) - requestedAmount) * 100) / 100
    );
    earnings.pendingBalance =
      Math.round((Number(earnings.pendingBalance || 0) + requestedAmount) * 100) / 100;
    await earnings.save();

    return payout;
  }
}

export const vendorPayoutService = new VendorPayoutService();
export default vendorPayoutService;
