import { BaseRepository } from './base.repository.js';
import { Product } from '../models/Product.model.js';
import { ProductVariant } from '../models/ProductVariant.model.js';

export class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }

  async findBySlug(slug) {
    return this.model
      .findOne({ slug })
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .populate('vendorId', 'storeName slug logo rating');
  }

  async findWithDetails(id) {
    return this.model
      .findById(id)
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .populate('vendorId', 'storeName slug logo rating');
  }

  async updateStock(productId, quantityChange) {
    return this.model.findOneAndUpdate(
      { _id: productId, stock: { $gte: -quantityChange < 0 ? 0 : -quantityChange } },
      { $inc: { stock: quantityChange } },
      { new: true }
    );
  }

  async findVariants(productId) {
    return ProductVariant.find({ productId, isActive: true });
  }
}

export const productRepository = new ProductRepository();
export default productRepository;
