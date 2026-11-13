import { Category } from '../../models/Category.model.js';
import { Product } from '../../models/Product.model.js';
import { ApiError } from '../../utils/apiError.js';
import { PRODUCT_STATUS } from '../../constants/productStatus.constant.js';
import mongoose from 'mongoose';

export class CategoryService {
  async getCategories(params = {}) {
    const filter = { isActive: true };
    if (params.parent !== undefined) {
      filter.parent = params.parent === 'null' ? null : params.parent;
    }
    return Category.find(filter).sort({ sortOrder: 1, name: 1 });
  }

  async getCategoryById(id) {
    let cat;
    if (mongoose.Types.ObjectId.isValid(id)) {
      cat = await Category.findById(id);
    }
    if (!cat) {
      cat = await Category.findOne({ slug: id });
    }
    if (!cat) {
      throw ApiError.notFound('Category not found');
    }
    return cat;
  }

  async getCategoryProducts(categoryId, params = {}) {
    const category = await this.getCategoryById(categoryId);
    const filter = {
      category: category._id,
      status: PRODUCT_STATUS.PUBLISHED,
      isActive: true,
    };
    return Product.find(filter).populate('brand', 'name slug');
  }
}

export const categoryService = new CategoryService();
export default categoryService;
