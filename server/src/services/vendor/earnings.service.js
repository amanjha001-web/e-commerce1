import { VendorEarnings } from '../../models/VendorEarnings.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { ApiError } from '../../utils/apiError.js';

export class VendorEarningsService {
  async getVendorId(userId) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw ApiError.notFound('Vendor profile not found');
    return vendor._id;
  }

  async getEarnings(userId) {
    const vendorId = await this.getVendorId(userId);
    let earnings = await VendorEarnings.findOne({ vendorId });
    if (!earnings) {
      earnings = await VendorEarnings.create({ vendorId });
    }
    return earnings;
  }

  async getEarningsSummary(userId) {
    return this.getEarnings(userId);
  }
}

export const vendorEarningsService = new VendorEarningsService();
export default vendorEarningsService;
