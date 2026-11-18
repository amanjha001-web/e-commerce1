import { VendorRequest } from '../../models/VendorRequest.model.js';
import { ApiError } from '../../utils/apiError.js';
import { VENDOR_STATUS } from '../../constants/vendorStatus.constant.js';

export class VendorRequestService {
  async createRequest(userId, requestData) {
    const existing = await VendorRequest.findOne({
      userId,
      status: { $in: [VENDOR_STATUS.PENDING, VENDOR_STATUS.UNDER_REVIEW, VENDOR_STATUS.APPROVED] },
    });

    if (existing) {
      if (existing.status === VENDOR_STATUS.APPROVED) {
        throw ApiError.badRequest('You are already an approved vendor');
      }
      throw ApiError.conflict('You already have a pending or active vendor application');
    }

    const storeName = (
      requestData.storeName ||
      requestData.shopName ||
      requestData.businessName ||
      'My Store'
    ).trim();

    const businessAddress = requestData.businessAddress || {
      street: requestData.address?.addressLine1 || requestData.address?.street || '',
      city: requestData.address?.city || '',
      state: requestData.address?.state || '',
      postalCode: requestData.address?.postalCode || requestData.address?.pincode || '',
      country: requestData.address?.country || 'India',
    };

    return VendorRequest.create({
      ...requestData,
      storeName,
      shopName: storeName,
      businessName: requestData.businessName || storeName,
      businessAddress,
      userId,
      status: VENDOR_STATUS.PENDING,
    });
  }

  async getMyRequest(userId) {
    const request = await VendorRequest.findOne({ userId, isDeleted: false }).sort({ createdAt: -1 });
    return request || null;
  }

  async getMyRequests(userId) {
    return VendorRequest.find({ userId, isDeleted: false }).sort({ createdAt: -1 });
  }

  async updateRequest(userId, requestId, updateData = {}) {
    const request = await VendorRequest.findOne({ _id: requestId, userId, isDeleted: false });
    if (!request) throw ApiError.notFound('Vendor request not found');

    if (request.status === VENDOR_STATUS.APPROVED) {
      throw ApiError.badRequest('Approved applications cannot be edited');
    }

    const clean = (value) => (typeof value === 'string' ? value.trim() : value);

    // Basic business fields
    ['businessName', 'description', 'email', 'phone', 'website', 'businessType', 'taxId'].forEach(
      (field) => {
        if (updateData[field] !== undefined) request[field] = clean(updateData[field]);
      }
    );

    const nextStoreName = clean(updateData.storeName || updateData.shopName);
    if (nextStoreName) {
      request.storeName = nextStoreName;
      request.shopName = nextStoreName;
    }

    // Address (keep address + businessAddress in sync)
    if (updateData.address && typeof updateData.address === 'object') {
      const a = updateData.address;
      request.address = {
        country: clean(a.country) || 'India',
        state: clean(a.state) || '',
        city: clean(a.city) || '',
        postalCode: clean(a.postalCode || a.pincode) || '',
        addressLine1: clean(a.addressLine1 || a.street) || '',
        addressLine2: clean(a.addressLine2) || '',
      };
      request.businessAddress = {
        street: request.address.addressLine1,
        city: request.address.city,
        state: request.address.state,
        postalCode: request.address.postalCode,
        country: request.address.country,
      };
    } else if (updateData.businessAddress && typeof updateData.businessAddress === 'object') {
      request.businessAddress = { ...request.businessAddress?.toObject?.(), ...updateData.businessAddress };
    }

    // Bank details
    if (updateData.bankDetails && typeof updateData.bankDetails === 'object') {
      const b = updateData.bankDetails;
      request.bankDetails = {
        accountHolderName: clean(b.accountHolderName) || '',
        accountNumber: clean(b.accountNumber) || '',
        ifscCode: (clean(b.ifscCode) || '').toUpperCase(),
        bankName: clean(b.bankName) || '',
        branchName: clean(b.branchName) || '',
        upiId: clean(b.upiId) || '',
      };
    }

    // Edited rejected application goes back to admin review queue
    if (request.status === VENDOR_STATUS.REJECTED) {
      request.status = VENDOR_STATUS.PENDING;
      request.rejectionReason = '';
      request.reviewNotes = '';
    }

    await request.save();
    return request;
  }

  async cancelRequest(userId, requestId) {
    const request = await VendorRequest.findOne({ _id: requestId, userId });
    if (!request) throw ApiError.notFound('Vendor request not found');

    if (request.status !== VENDOR_STATUS.PENDING) {
      throw ApiError.badRequest('Can only cancel requests in pending status');
    }

    request.status = VENDOR_STATUS.REJECTED;
    request.rejectionReason = 'Cancelled by applicant';
    await request.save();

    return request;
  }
}

export const vendorRequestService = new VendorRequestService();
export default vendorRequestService;
