import { Product } from '../../models/Product.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';
import { PRODUCT_STATUS } from '../../constants/productStatus.constant.js';

export class AdminProductService {
  async getAdminProducts(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = {};

    if (params.status) filter.status = params.status;
    if (params.category) filter.category = params.category;
    if (params.vendorId) filter.vendorId = params.vendorId;
    if (params.search) {
      filter.name = { $regex: params.search, $options: 'i' };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .populate('brand', 'name slug')
        .populate('vendorId', 'storeName slug email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPendingProducts(params = {}) {
    return this.getAdminProducts({ ...params, status: PRODUCT_STATUS.PENDING_APPROVAL });
  }

  async getProductById(productId) {
    const product = await Product.findById(productId)
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .populate('vendorId', 'storeName slug email');

    if (!product) throw ApiError.notFound('Product not found');
    return product;
  }

  async approveProduct(productId) {
    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');

    product.status = PRODUCT_STATUS.PUBLISHED;
    product.isActive = true;
    product.rejectionReason = '';
    await product.save();

    return product;
  }

  async rejectProduct(productId, reason = 'Rejected by admin moderation') {
    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');

    product.status = PRODUCT_STATUS.REJECTED;
    product.rejectionReason = reason;
    await product.save();

    return product;
  }

  async updateProduct(productId, updateData) {
    const product = await Product.findByIdAndUpdate(productId, updateData, {
      new: true,
      runValidators: true,
    });
    if (!product) throw ApiError.notFound('Product not found');
    return product;
  }

  async updateProductStatus(productId, isActive) {
    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');

    product.isActive = Boolean(isActive);
    await product.save();
    return product;
  }

  async deleteProduct(productId) {
    const product = await Product.findByIdAndDelete(productId);
    if (!product) throw ApiError.notFound('Product not found');
    return { message: 'Product deleted successfully' };
  }
}

export const adminProductService = new AdminProductService();
export default adminProductService;
