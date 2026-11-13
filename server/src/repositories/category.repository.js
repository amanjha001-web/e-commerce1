import { BaseRepository } from './base.repository.js';
import { Category } from '../models/Category.model.js';

export class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }

  async findBySlug(slug) {
    return this.model.findOne({ slug });
  }

  async findActiveCategories() {
    return this.model.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  }
}

export const categoryRepository = new CategoryRepository();
export default categoryRepository;
