import { Product } from '../../models/Product.model.js';
import { Category } from '../../models/Category.model.js';
import { Brand } from '../../models/Brand.model.js';
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

    // Category Filter (support ObjectId, slug, name, or array)
    const categoryParam = queryParams.category || queryParams.categories;
    if (categoryParam) {
      const rawCategories = Array.isArray(categoryParam)
        ? categoryParam
        : typeof categoryParam === 'string' && categoryParam.includes(',')
        ? categoryParam.split(',')
        : [categoryParam];

      const objectIds = [];
      let specifiedNonAll = false;

      for (const cat of rawCategories) {
        const trimmed = String(cat).trim();
        if (!trimmed || trimmed === 'All' || trimmed === 'all') continue;
        specifiedNonAll = true;

        if (mongoose.Types.ObjectId.isValid(trimmed) && String(new mongoose.Types.ObjectId(trimmed)) === trimmed) {
          objectIds.push(new mongoose.Types.ObjectId(trimmed));
        } else {
          const matched = await Category.findOne({
            $or: [
              { slug: trimmed.toLowerCase() },
              { name: { $regex: new RegExp(`^${trimmed}$`, 'i') } },
            ],
          }).select('_id');
          if (matched) {
            objectIds.push(matched._id);
          }
        }
      }

      if (specifiedNonAll) {
        if (objectIds.length > 0) {
          filter.category = objectIds.length === 1 ? objectIds[0] : { $in: objectIds };
        } else {
          filter.category = new mongoose.Types.ObjectId();
        }
      }
    }

    // Brand Filter (support ObjectId, slug, name, or array)
    const brandParam = queryParams.brand || queryParams.brands;
    if (brandParam) {
      const rawBrands = Array.isArray(brandParam)
        ? brandParam
        : typeof brandParam === 'string' && brandParam.includes(',')
        ? brandParam.split(',')
        : [brandParam];

      const brandIds = [];
      let specifiedBrand = false;

      for (const b of rawBrands) {
        const trimmed = String(b).trim();
        if (!trimmed || trimmed === 'All' || trimmed === 'all') continue;
        specifiedBrand = true;

        if (mongoose.Types.ObjectId.isValid(trimmed) && String(new mongoose.Types.ObjectId(trimmed)) === trimmed) {
          brandIds.push(new mongoose.Types.ObjectId(trimmed));
        } else {
          const matched = await Brand.findOne({
            $or: [
              { slug: trimmed.toLowerCase() },
              { name: { $regex: new RegExp(`^${trimmed}$`, 'i') } },
            ],
          }).select('_id');
          if (matched) {
            brandIds.push(matched._id);
          }
        }
      }

      if (specifiedBrand) {
        if (brandIds.length > 0) {
          filter.brand = brandIds.length === 1 ? brandIds[0] : { $in: brandIds };
        } else {
          filter.brand = new mongoose.Types.ObjectId();
        }
      }
    }

    // Price Range Filter
    if (
      (queryParams.minPrice !== undefined && queryParams.minPrice !== '') ||
      (queryParams.maxPrice !== undefined && queryParams.maxPrice !== '')
    ) {
      filter.price = {};
      if (queryParams.minPrice !== undefined && queryParams.minPrice !== '') {
        const minP = Number(queryParams.minPrice);
        if (!isNaN(minP)) filter.price.$gte = minP;
      }
      if (queryParams.maxPrice !== undefined && queryParams.maxPrice !== '') {
        const maxP = Number(queryParams.maxPrice);
        if (!isNaN(maxP)) filter.price.$lte = maxP;
      }
      if (Object.keys(filter.price).length === 0) {
        delete filter.price;
      }
    }

    // Rating Filter
    if (queryParams.rating !== undefined && queryParams.rating !== '') {
      const r = Number(queryParams.rating);
      if (!isNaN(r) && r > 0) {
        filter.rating = { $gte: r };
      }
    }

    // In Stock Filter
    if (queryParams.inStock === 'true' || queryParams.inStock === true) {
      filter.stock = { $gt: 0 };
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
