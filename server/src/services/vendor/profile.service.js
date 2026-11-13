import { Vendor } from '../../models/Vendor.model.js';
import { ApiError } from '../../utils/apiError.js';

export class VendorProfileService {
  async getProfile(userId) {
    const vendor = await Vendor.findOne({ userId }).populate('userId', 'name email phone avatar');
    if (!vendor) throw ApiError.notFound('Vendor profile not found');
    return vendor;
  }

  async updateProfile(userId, updateData) {
    const vendor = await Vendor.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!vendor) throw ApiError.notFound('Vendor profile not found');
    return vendor;
  }
}

export const vendorProfileService = new VendorProfileService();
export default vendorProfileService;
