import { BaseRepository } from './base.repository.js';
import { Brand } from '../models/Brand.model.js';

export class BrandRepository extends BaseRepository {
  constructor() {
    super(Brand);
  }

  async findBySlug(slug) {
    return this.model.findOne({ slug });
  }

  async findActiveBrands() {
    return this.model.find({ isActive: true }).sort({ name: 1 });
  }
}

export const brandRepository = new BrandRepository();
export default brandRepository;
