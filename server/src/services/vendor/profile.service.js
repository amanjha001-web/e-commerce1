import { Vendor } from '../../models/Vendor.model.js';
import { ApiError } from '../../utils/apiError.js';
import { buildSafeStoreUpdate } from './store.service.js';

export class VendorProfileService {
  async getProfile(userId) {
    const vendor = await Vendor.findOne({ $or: [{ userId }, { user: userId }] }).populate(
      'userId',
      'fullName name email phone avatar'
    );
    if (!vendor) throw ApiError.notFound('Vendor profile not found');
    return vendor;
  }

  async updateProfile(userId, updateData) {
    const existing = await Vendor.findOne({ $or: [{ userId }, { user: userId }] });
    if (!existing) throw ApiError.notFound('Vendor profile not found');

    const safeUpdates = buildSafeStoreUpdate(existing, updateData);
    const vendor = await Vendor.findByIdAndUpdate(
      existing._id,
      { $set: safeUpdates },
      { new: true, runValidators: true }
    );
    if (!vendor) throw ApiError.notFound('Vendor profile not found');
    return vendor;
  }
}

export const vendorProfileService = new VendorProfileService();
export default vendorProfileService;
