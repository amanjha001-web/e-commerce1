import { ShippingZone } from '../../models/ShippingZone.model.js';
import { ApiError } from '../../utils/apiError.js';

export class SuperAdminShippingService {
  async getAll(params = {}) {
    return ShippingZone.find();
  }

  async getById(zoneId) {
    const zone = await ShippingZone.findById(zoneId);
    if (!zone) throw ApiError.notFound('Shipping zone not found');
    return zone;
  }

  async create(zoneData) {
    return ShippingZone.create(zoneData);
  }

  async update(zoneId, zoneData) {
    const zone = await ShippingZone.findByIdAndUpdate(zoneId, zoneData, { new: true });
    if (!zone) throw ApiError.notFound('Shipping zone not found');
    return zone;
  }

  async delete(zoneId) {
    const zone = await ShippingZone.findByIdAndDelete(zoneId);
    if (!zone) throw ApiError.notFound('Shipping zone not found');
    return { message: 'Shipping zone deleted successfully' };
  }

  async updateStatus(zoneId, isActive) {
    const zone = await ShippingZone.findByIdAndUpdate(
      zoneId,
      { isActive: Boolean(isActive) },
      { new: true }
    );
    if (!zone) throw ApiError.notFound('Shipping zone not found');
    return zone;
  }
}

export const superAdminShippingService = new SuperAdminShippingService();
export default superAdminShippingService;
