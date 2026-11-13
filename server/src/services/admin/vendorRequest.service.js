import { VendorRequest } from '../../models/VendorRequest.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { User } from '../../models/User.model.js';
import { VendorEarnings } from '../../models/VendorEarnings.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination, slugify } from '../../utils/helpers.js';
import { VENDOR_STATUS } from '../../constants/vendorStatus.constant.js';
import { ROLES } from '../../constants/roles.constant.js';
import { sendVendorStatusEmail } from '../../integrations/email/email.client.js';

export class AdminVendorRequestService {
  async getRequests(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = { isDeleted: false };

    if (params.status) filter.status = params.status;
    if (params.search) {
      filter.$or = [
        { storeName: { $regex: params.search, $options: 'i' } },
        { email: { $regex: params.search, $options: 'i' } },
      ];
    }

    const [requests, total] = await Promise.all([
      VendorRequest.find(filter)
        .populate('userId', 'name email phone avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      VendorRequest.countDocuments(filter),
    ]);

    return {
      requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRequestById(requestId) {
    const request = await VendorRequest.findById(requestId).populate('userId', 'name email phone avatar');
    if (!request) throw ApiError.notFound('Vendor request not found');
    return request;
  }

  async approveRequest(requestId, adminId) {
    const request = await VendorRequest.findById(requestId);
    if (!request) throw ApiError.notFound('Vendor request not found');

    request.status = VENDOR_STATUS.APPROVED;
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    await request.save();

    // Create Vendor store entity
    const baseSlug = slugify(request.storeName);
    let slug = baseSlug;
    let counter = 1;
    while (await Vendor.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    let vendor = await Vendor.findOne({ userId: request.userId });
    if (!vendor) {
      vendor = await Vendor.create({
        userId: request.userId,
        storeName: request.storeName,
        slug,
        email: request.email,
        phone: request.phone,
        description: request.description,
        address: request.businessAddress,
        status: VENDOR_STATUS.APPROVED,
        isActive: true,
      });

      // Initialize earnings tracker
      await VendorEarnings.create({ vendorId: vendor._id });
    } else {
      vendor.status = VENDOR_STATUS.APPROVED;
      vendor.isActive = true;
      await vendor.save();
    }

    // Elevate user role
    await User.findByIdAndUpdate(request.userId, {
      role: ROLES.VENDOR,
      vendorId: vendor._id,
    });

    sendVendorStatusEmail(request.email, request.storeName, 'approved').catch(() => {});

    return { request, vendor };
  }

  async rejectRequest(requestId, adminId, reason = 'Application rejected') {
    const request = await VendorRequest.findById(requestId);
    if (!request) throw ApiError.notFound('Vendor request not found');

    request.status = VENDOR_STATUS.REJECTED;
    request.rejectionReason = reason;
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    await request.save();

    sendVendorStatusEmail(request.email, request.storeName, 'rejected', reason).catch(() => {});

    return request;
  }

  async reviewRequest(requestId, adminId, reviewData = {}) {
    const request = await VendorRequest.findById(requestId);
    if (!request) throw ApiError.notFound('Vendor request not found');

    request.status = VENDOR_STATUS.UNDER_REVIEW;
    request.reviewNotes = reviewData.notes || request.reviewNotes;
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    await request.save();

    return request;
  }

  async restoreRequest(requestId) {
    const request = await VendorRequest.findByIdAndUpdate(
      requestId,
      { isDeleted: false },
      { new: true }
    );
    if (!request) throw ApiError.notFound('Vendor request not found');
    return request;
  }

  async deleteRequest(requestId) {
    const request = await VendorRequest.findByIdAndUpdate(
      requestId,
      { isDeleted: true },
      { new: true }
    );
    if (!request) throw ApiError.notFound('Vendor request not found');
    return { message: 'Vendor request archived successfully' };
  }
}

export const adminVendorRequestService = new AdminVendorRequestService();
export default adminVendorRequestService;
