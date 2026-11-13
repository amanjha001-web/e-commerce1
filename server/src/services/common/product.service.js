import { Product } from '../../models/Product.model.js';
import { RecentlyViewed } from '../../models/RecentlyViewed.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';
import { PRODUCT_STATUS } from '../../constants/productStatus.constant.js';
import mongoose from 'mongoose';

export class ProductService {
  async getProducts(queryParams = {}) {
    const { page, limit, skip, sort } = parsePagination(queryParams);
    const filter = { status: PRODUCT_STATUS.PUBLISHED, isActive: true };

    if (queryParams.search) {
      filter.$or = [
        { name: { $regex: queryParams.search, $options: 'i' } },
        { description: { $regex: queryParams.search, $options: 'i' } },
        { tags: { $in: [new RegExp(queryParams.search, 'i')] } },
      ];
    }

    if (queryParams.category) {
      filter.category = queryParams.category;
    }

    if (queryParams.brand) {
      filter.brand = queryParams.brand;
    }

    if (queryParams.minPrice || queryParams.maxPrice) {
      filter.price = {};
      if (queryParams.minPrice) filter.price.$gte = Number(queryParams.minPrice);
      if (queryParams.maxPrice) filter.price.$lte = Number(queryParams.maxPrice);
    }

    if (queryParams.rating) {
      filter.rating = { $gte: Number(queryParams.rating) };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .populate('brand', 'name slug logo')
        .populate('vendorId', 'storeName slug rating')
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

  async getProductById(id) {
    let product;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }
    if (!product) {
      product = await Product.findOne({ slug: id });
    }

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    await product.populate([
      { path: 'category', select: 'name slug' },
      { path: 'brand', select: 'name slug logo' },
      { path: 'vendorId', select: 'storeName slug logo description rating numReviews' },
    ]);

    return product;
  }

  async getFlashSaleProducts(params = {}) {
    const { limit = 10 } = params;
    return Product.find({
      status: PRODUCT_STATUS.PUBLISHED,
      isActive: true,
      isFlashSale: true,
    })
      .populate('category', 'name slug')
      .populate('vendorId', 'storeName slug')
      .limit(Number(limit));
  }

  async getTrendingProducts(params = {}) {
    const { limit = 10 } = params;
    return Product.find({
      status: PRODUCT_STATUS.PUBLISHED,
      isActive: true,
      isTrending: true,
    })
      .populate('category', 'name slug')
      .populate('vendorId', 'storeName slug')
      .limit(Number(limit));
  }

  async getBestSellerProducts(params = {}) {
    const { limit = 10 } = params;
    return Product.find({
      status: PRODUCT_STATUS.PUBLISHED,
      isActive: true,
      isBestSeller: true,
    })
      .populate('category', 'name slug')
      .populate('vendorId', 'storeName slug')
      .limit(Number(limit));
  }

  async getNewArrivalProducts(params = {}) {
    const { limit = 10 } = params;
    return Product.find({
      status: PRODUCT_STATUS.PUBLISHED,
      isActive: true,
      isNewArrival: true,
    })
      .sort({ createdAt: -1 })
      .populate('category', 'name slug')
      .populate('vendorId', 'storeName slug')
      .limit(Number(limit));
  }

  async getRelatedProducts(productId) {
    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');

    return Product.find({
      _id: { $ne: product._id },
      category: product.category,
      status: PRODUCT_STATUS.PUBLISHED,
      isActive: true,
    })
      .limit(8)
      .populate('category', 'name slug');
  }

  async getRecentlyViewed(userId) {
    if (!userId) return [];
    const recent = await RecentlyViewed.find({ userId })
      .sort({ viewedAt: -1 })
      .limit(10)
      .populate({
        path: 'productId',
        populate: [{ path: 'category', select: 'name slug' }],
      });

    return recent.map((r) => r.productId).filter(Boolean);
  }

  async addRecentlyViewed(userId, productId) {
    if (!userId || !productId) return;
    await RecentlyViewed.findOneAndUpdate(
      { userId, productId },
      { viewedAt: new Date() },
      { upsert: true, new: true }
    );
  }
}

export const productService = new ProductService();
export default productService;
