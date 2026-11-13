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
