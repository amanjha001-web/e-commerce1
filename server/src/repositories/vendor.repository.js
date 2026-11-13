import { BaseRepository } from './base.repository.js';
import { Vendor } from '../models/Vendor.model.js';

export class VendorRepository extends BaseRepository {
  constructor() {
    super(Vendor);
  }

  async findByUserId(userId) {
    return this.model.findOne({ userId }).populate('userId', 'name email phone avatar');
  }

  async findBySlug(slug) {
    return this.model.findOne({ slug, isActive: true });
  }
}

export const vendorRepository = new VendorRepository();
export default vendorRepository;
