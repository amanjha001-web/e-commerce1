import { Vendor } from '../../models/Vendor.model.js';
import { User } from '../../models/User.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';
import { VENDOR_STATUS } from '../../constants/vendorStatus.constant.js';
import { ROLES } from '../../constants/roles.constant.js';
import { sendVendorStatusEmail } from '../../integrations/email/email.client.js';

export class AdminVendorService {
  async getVendors(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = {};

    if (params.status) filter.status = params.status;
    if (params.search) {
      filter.$or = [
        { storeName: { $regex: params.search, $options: 'i' } },
        { email: { $regex: params.search, $options: 'i' } },
      ];
    }

    const [vendors, total] = await Promise.all([
      Vendor.find(filter)
        .populate('userId', 'name email phone avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Vendor.countDocuments(filter),
    ]);

    return {
      vendors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVendorById(vendorId) {
    const vendor = await Vendor.findById(vendorId).populate('userId', 'name email phone avatar');
    if (!vendor) throw ApiError.notFound('Vendor not found');
    return vendor;
  }

  async updateVendor(vendorId, updateData) {
    const vendor = await Vendor.findByIdAndUpdate(vendorId, updateData, {
      new: true,
      runValidators: true,
    });
    if (!vendor) throw ApiError.notFound('Vendor not found');
    return vendor;
  }

  async toggleVendorStatus(vendorId, isActive) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw ApiError.notFound('Vendor not found');

    vendor.isActive = isActive !== undefined ? isActive : !vendor.isActive;
    await vendor.save();
    return vendor;
  }

  async approveVendor(vendorId) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw ApiError.notFound('Vendor not found');

    vendor.status = VENDOR_STATUS.APPROVED;
    vendor.isActive = true;
    await vendor.save();

    // Elevate associated user role to vendor
    await User.findByIdAndUpdate(vendor.userId, {
      role: ROLES.VENDOR,
      vendorId: vendor._id,
    });

    const user = await User.findById(vendor.userId);
    if (user) {
      sendVendorStatusEmail(user.email, vendor.storeName, 'approved').catch(() => {});
    }

    return vendor;
  }

  async rejectVendor(vendorId, reason = 'Application rejected by admin') {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw ApiError.notFound('Vendor not found');

    vendor.status = VENDOR_STATUS.REJECTED;
    vendor.rejectionReason = reason;
    await vendor.save();

    const user = await User.findById(vendor.userId);
    if (user) {
      sendVendorStatusEmail(user.email, vendor.storeName, 'rejected', reason).catch(() => {});
    }

    return vendor;
  }

  async deleteVendor(vendorId) {
    const vendor = await Vendor.findByIdAndDelete(vendorId);
    if (!vendor) throw ApiError.notFound('Vendor not found');
    return { message: 'Vendor deleted successfully' };
  }
}

export const adminVendorService = new AdminVendorService();
export default adminVendorService;
