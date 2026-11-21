import mongoose from 'mongoose';
import { Product } from '../../models/Product.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { User } from '../../models/User.model.js';
import { Category } from '../../models/Category.model.js';
import { Inventory } from '../../models/Inventory.model.js';
import { StockMovement } from '../../models/StockMovement.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';
import { PRODUCT_STATUS, PRODUCT_STATUS_LIST } from '../../constants/productStatus.constant.js';
import { notificationService } from '../common/notification.service.js';

const ensureValidObjectId = (id, label = 'Product ID') => {
  if (!id || !mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
};

const toPlain = (doc) => (doc?.toObject ? doc.toObject() : { ...(doc || {}) });

const extractObjectIdString = (val) => {
  if (!val) return '';
  if (typeof val === 'object' && val._id) return String(val._id);
  return mongoose.isValidObjectId(val) ? String(val) : '';
};

const hasVendorName = (v) =>
  Boolean(v && typeof v === 'object' && (v.storeName || v.shopName || v.businessName || v.fullName || v.name));

const hasCategoryName = (c) => Boolean(c && typeof c === 'object' && c.name);

const resolveLegacyProductRelations = async (docs = []) => {
  if (mongoose.connection.readyState !== 1 || !Array.isArray(docs) || docs.length === 0) {
    return { vendors: new Map(), categories: new Map() };
  }

  const vendorRefs = [];
  const categoryRefs = [];

  for (const doc of docs) {
    const raw = toPlain(doc);
    if (!hasVendorName(raw.vendorId) && !hasVendorName(raw.vendor)) {
      const vid = extractObjectIdString(raw.vendorId);
      const legacyVid = extractObjectIdString(raw.vendor);
      if (vid) vendorRefs.push(vid);
      if (legacyVid) vendorRefs.push(legacyVid);
    }
    if (!hasCategoryName(raw.category)) {
      const cid = extractObjectIdString(raw.categoryId) || extractObjectIdString(raw.category);
      if (cid) categoryRefs.push(cid);
    }
  }

  const uniqueVendorRefs = [...new Set(vendorRefs)];
  const uniqueCategoryRefs = [...new Set(categoryRefs)];

  const vendorsMap = new Map();
  const categoriesMap = new Map();

  if (uniqueVendorRefs.length > 0) {
    const [foundVendors, foundUsers] = await Promise.all([
      Promise.resolve()
        .then(() =>
          Vendor.find({
            $or: [
              { _id: { $in: uniqueVendorRefs } },
              { userId: { $in: uniqueVendorRefs } },
              { user: { $in: uniqueVendorRefs } },
            ],
          })
            .select('storeName shopName businessName slug shopSlug email phone status isActive userId user')
            .lean()
        )
        .catch(() => []),
      Promise.resolve()
        .then(() =>
          User.find({ _id: { $in: uniqueVendorRefs } })
            .select('fullName name email phone isActive vendorId')
            .lean()
        )
        .catch(() => []),
    ]);

    for (const v of foundVendors || []) {
      const idStr = v._id ? String(v._id) : '';
      const uidStr = extractObjectIdString(v.userId) || extractObjectIdString(v.user);
      if (idStr) vendorsMap.set(idStr, v);
      if (uidStr && !vendorsMap.has(uidStr)) vendorsMap.set(uidStr, v);
    }
    for (const u of foundUsers || []) {
      const idStr = u._id ? String(u._id) : '';
      if (idStr && !vendorsMap.has(idStr)) {
        vendorsMap.set(idStr, {
          _id: u._id,
          storeName: u.fullName || u.name || u.email || 'Vendor',
          shopName: u.fullName || u.name || u.email || 'Vendor',
          email: u.email || '',
          phone: u.phone || '',
          isActive: u.isActive !== false,
          status: 'approved',
        });
      }
    }
  }

  if (uniqueCategoryRefs.length > 0) {
    const foundCategories = await Promise.resolve()
      .then(() =>
        Category.find({ _id: { $in: uniqueCategoryRefs } })
          .select('name slug')
          .lean()
      )
      .catch(() => []);
    for (const c of foundCategories || []) {
      if (c?._id) categoriesMap.set(String(c._id), c);
    }
  }

  return { vendors: vendorsMap, categories: categoriesMap };
};

const syncLegacyProductFields = (product) => {
  if (!product) return;
  const legacyVendor = product.get?.('vendor') || product.vendor;
  if (!product.vendorId && legacyVendor) {
    product.vendorId = legacyVendor._id || legacyVendor;
  }
  const legacyCategory = product.get?.('categoryId') || product.categoryId;
  if (!product.category && legacyCategory) {
    product.category = legacyCategory._id || legacyCategory;
  }
};

const formatAdminProduct = (doc, legacyRelations = {}) => {
  if (!doc) return null;
  const raw = toPlain(doc);

  let categoryObj =
    raw.category && typeof raw.category === 'object' ? toPlain(raw.category) : null;
  if (!hasCategoryName(categoryObj) && legacyRelations.categories instanceof Map) {
    const cid = extractObjectIdString(raw.categoryId) || extractObjectIdString(raw.category);
    if (cid && legacyRelations.categories.has(cid)) {
      categoryObj = legacyRelations.categories.get(cid);
    }
  }

  const brandObj =
    raw.brand && typeof raw.brand === 'object' ? toPlain(raw.brand) : null;

  let vendorObj = hasVendorName(raw.vendorId)
    ? toPlain(raw.vendorId)
    : hasVendorName(raw.vendor)
      ? toPlain(raw.vendor)
      : null;

  if (!vendorObj && legacyRelations.vendors instanceof Map) {
    const vid = extractObjectIdString(raw.vendorId);
    const legacyVid = extractObjectIdString(raw.vendor);
    vendorObj =
      (vid ? legacyRelations.vendors.get(vid) : null) ||
      (legacyVid ? legacyRelations.vendors.get(legacyVid) : null) ||
      null;
  }

  if (!vendorObj && raw.vendorId && typeof raw.vendorId === 'object') {
    vendorObj = toPlain(raw.vendorId);
  }

  const resolvedVendorName =
    vendorObj?.storeName ||
    vendorObj?.shopName ||
    vendorObj?.businessName ||
    vendorObj?.fullName ||
    vendorObj?.name ||
    raw.vendorName ||
    raw.storeName ||
    '';

  const isActive = raw.isActive !== false;
  const rawStatus = String(raw.status || PRODUCT_STATUS.PENDING_APPROVAL)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  const displayStatus = !isActive && rawStatus === PRODUCT_STATUS.PUBLISHED ? 'disabled' : rawStatus;

  const firstImage = Array.isArray(raw.images) ? raw.images[0] : null;
  const legacyThumb =
    typeof raw.thumbnail === 'string'
      ? raw.thumbnail
      : raw.thumbnail?.url || raw.thumbnail?.secure_url || '';
  const thumbnail =
    (typeof firstImage === 'string'
      ? firstImage
      : firstImage?.url || firstImage?.secure_url) ||
    legacyThumb ||
    '';

  return {
    ...raw,
    status: rawStatus,
    category: categoryObj || raw.category,
    sellingPrice: raw.price ?? 0,
    categoryName: categoryObj?.name || raw.categoryName || '',
    brandName: brandObj?.name || raw.brandName || '',
    vendorName: resolvedVendorName,
    storeName: resolvedVendorName,
    vendor: vendorObj
      ? {
          _id: vendorObj._id,
          storeName: resolvedVendorName,
          shopName: resolvedVendorName,
          slug: vendorObj.slug || vendorObj.shopSlug || '',
          email: vendorObj.email || '',
          phone: vendorObj.phone || '',
          status: vendorObj.status || 'pending',
          isActive: vendorObj.isActive !== false,
        }
      : undefined,
    rating: raw.rating ?? raw.averageRating ?? 0,
    numReviews: raw.numReviews ?? raw.totalReviews ?? 0,
    isFeatured: raw.isFeatured ?? raw.featured ?? false,
    isFlashSale: raw.isFlashSale ?? raw.flashSale ?? false,
    isBestSeller: raw.isBestSeller ?? raw.bestSeller ?? false,
    isTrending: raw.isTrending ?? raw.trending ?? false,
    isNewArrival: raw.isNewArrival ?? raw.newArrival ?? false,
    isActive,
    displayStatus,
    thumbnail,
  };
};

const notifyVendorProductEvent = async (product, { title, message, status }) => {
  const vendorRef = product?.vendorId || product?.get?.('vendor') || product?.vendor;
  if (!vendorRef) return;
  const vendor = await Promise.resolve()
    .then(() =>
      mongoose.connection.readyState === 1
        ? Vendor.findOne({
            $or: [{ _id: vendorRef }, { userId: vendorRef }, { user: vendorRef }],
          })
            .select('userId user')
            .lean()
        : Vendor.findById(vendorRef).select('userId').lean()
    )
    .catch(() => null);
  const recipientUserId = vendor?.userId || vendor?.user;
  if (!recipientUserId) return;

  notificationService
    .createNotification({
      userId: recipientUserId,
      title,
      message,
      type: 'product',
      link: '/vendor/products',
      data: { productId: product._id, status },
    })
    .catch(() => {});
};

export class AdminProductService {
  async getAdminProducts(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = {};
    const andClauses = [];
    const isConnected = mongoose.connection.readyState === 1;

    if (params.status && String(params.status).toLowerCase() !== 'all') {
      const normalizedStatus = String(params.status)
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');

      if (normalizedStatus === 'disabled' || normalizedStatus === 'inactive') {
        filter.isActive = false;
      } else if (
        normalizedStatus === 'published' ||
        normalizedStatus === 'active'
      ) {
        filter.status = isConnected
          ? { $in: [PRODUCT_STATUS.PUBLISHED, 'published', 'Published', 'active', 'approved'] }
          : PRODUCT_STATUS.PUBLISHED;
        filter.isActive = { $ne: false };
      } else if (
        normalizedStatus === 'pending' ||
        normalizedStatus === PRODUCT_STATUS.PENDING_APPROVAL
      ) {
        filter.status = isConnected
          ? /^(pending|pending[_\s-]*approval)$/i
          : { $in: [PRODUCT_STATUS.PENDING_APPROVAL, 'pending'] };
      } else if (PRODUCT_STATUS_LIST.includes(normalizedStatus)) {
        filter.status = isConnected
          ? new RegExp(`^${normalizedStatus.replace(/_/g, '[\\s_-]*')}$`, 'i')
          : normalizedStatus;
      }
    }

    if (params.stock && String(params.stock).toLowerCase() !== 'all') {
      const stockMode = String(params.stock)
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
      if (stockMode === 'out_of_stock') {
        filter.stock = { $lte: 0 };
      } else if (stockMode === 'low_stock') {
        filter.stock = { $gt: 0, $lte: 10 };
      } else if (stockMode === 'in_stock') {
        filter.stock = { $gt: 0 };
      }
    }

    if (params.category && String(params.category).toLowerCase() !== 'all') {
      ensureValidObjectId(params.category, 'Category ID');
      if (isConnected) {
        andClauses.push({
          $or: [{ category: params.category }, { categoryId: params.category }],
        });
      } else {
        filter.category = params.category;
      }
    }
    if (params.vendorId && String(params.vendorId).toLowerCase() !== 'all') {
      ensureValidObjectId(params.vendorId, 'Vendor ID');
      if (isConnected) {
        andClauses.push({
          $or: [{ vendorId: params.vendorId }, { vendor: params.vendorId }],
        });
      } else {
        filter.vendorId = params.vendorId;
      }
    }

    if (params.search && String(params.search).trim()) {
      const regex = { $regex: String(params.search).trim(), $options: 'i' };

      const [matchingVendors, matchingCategories] = await Promise.all([
        Promise.resolve()
          .then(() =>
            Vendor.find({
              $or: [
                { storeName: regex },
                { shopName: regex },
                { businessName: regex },
                { email: regex },
              ],
            })
              .select('_id userId user')
              .lean()
          )
          .catch(() => []),
        Promise.resolve()
          .then(() => Category.find({ name: regex }).select('_id').lean())
          .catch(() => []),
      ]);

      const searchClauses = [{ name: regex }, { sku: regex }, { tags: regex }];
      if (matchingVendors?.length > 0) {
        const matchedVendorIds = matchingVendors.map((v) => v._id).filter(Boolean);
        const matchedVendorUsers = matchingVendors
          .map((v) => v.userId || v.user)
          .filter(Boolean);
        searchClauses.push(
          { vendorId: { $in: matchedVendorIds } },
          { vendor: { $in: [...matchedVendorIds, ...matchedVendorUsers] } }
        );
      }
      if (matchingCategories?.length > 0) {
        const matchedCatIds = matchingCategories.map((c) => c._id);
        searchClauses.push(
          { category: { $in: matchedCatIds } },
          { categoryId: { $in: matchedCatIds } }
        );
      }

      if (andClauses.length > 0) {
        andClauses.push({ $or: searchClauses });
      } else {
        filter.$or = searchClauses;
      }
    }

    if (andClauses.length > 0) {
      filter.$and = andClauses;
    }

    const [
      products,
      total,
      totalAll,
      publishedCount,
      pendingCount,
      rejectedCount,
      disabledCount,
      lowStockCount,
      outOfStockCount,
    ] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .populate('brand', 'name slug')
        .populate('vendorId', 'storeName shopName businessName slug shopSlug email phone status isActive')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
      Product.countDocuments(),
      Product.countDocuments({
        status: { $in: [PRODUCT_STATUS.PUBLISHED, 'active', 'approved', 'Published'] },
        isActive: { $ne: false },
      }),
      Product.countDocuments({
        status: isConnected
          ? /^(pending|pending[_\s-]*approval)$/i
          : { $in: [PRODUCT_STATUS.PENDING_APPROVAL, 'pending'] },
      }),
      Product.countDocuments({ status: isConnected ? /^rejected$/i : PRODUCT_STATUS.REJECTED }),
      Product.countDocuments({ isActive: false }),
      Product.countDocuments({ stock: { $gt: 0, $lte: 10 } }),
      Product.countDocuments({ stock: { $lte: 0 } }),
    ]);

    const legacyRelations = await resolveLegacyProductRelations(products);

    return {
      products: products.map((doc) => formatAdminProduct(doc, legacyRelations)),
      summary: {
        total: totalAll,
        published: publishedCount,
        pendingApproval: pendingCount,
        rejected: rejectedCount,
        disabled: disabledCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
      },
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
    ensureValidObjectId(productId, 'Product ID');

    const product = await Product.findById(productId)
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .populate('vendorId', 'storeName shopName businessName slug shopSlug email phone status isActive');

    if (!product) throw ApiError.notFound('Product not found');
    const legacyRelations = await resolveLegacyProductRelations([product]);
    return formatAdminProduct(product, legacyRelations);
  }

  async approveProduct(productId, adminId) {
    ensureValidObjectId(productId, 'Product ID');

    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');

    syncLegacyProductFields(product);
    product.status = PRODUCT_STATUS.PUBLISHED;
    product.isActive = true;
    product.rejectionReason = '';
    await product.save({ validateModifiedOnly: true });

    await Promise.resolve()
      .then(() =>
        Inventory.findOneAndUpdate(
          { productId: product._id },
          {
            $setOnInsert: {
              productId: product._id,
              vendorId: product.vendorId,
              quantity: Number(product.stock || 0),
              isOutOfStock: Number(product.stock || 0) <= 0,
            },
          },
          { upsert: true }
        )
      )
      .catch(() => {});

    await notifyVendorProductEvent(product, {
      title: 'Product Approved',
      message: `Your product "${product.name}" has been approved and is now live in the store.`,
      status: PRODUCT_STATUS.PUBLISHED,
    });

    return this.getProductById(product._id);
  }

  async rejectProduct(productId, reason = 'Rejected by admin moderation', adminId) {
    ensureValidObjectId(productId, 'Product ID');

    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');

    syncLegacyProductFields(product);
    const finalReason = String(reason || '').trim() || 'Rejected by admin moderation';
    product.status = PRODUCT_STATUS.REJECTED;
    product.isActive = false;
    product.rejectionReason = finalReason;
    await product.save({ validateModifiedOnly: true });

    await notifyVendorProductEvent(product, {
      title: 'Product Rejected',
      message: `Your product "${product.name}" was rejected. Reason: ${finalReason}`,
      status: PRODUCT_STATUS.REJECTED,
    });

    return this.getProductById(product._id);
  }

  async updateProduct(productId, updateData = {}, adminId) {
    ensureValidObjectId(productId, 'Product ID');

    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');

    syncLegacyProductFields(product);
    const prevStock = Number(product.stock || 0);

    if (updateData.name !== undefined) {
      const cleanName = String(updateData.name).trim();
      if (!cleanName) throw ApiError.badRequest('Product name cannot be empty');
      product.name = cleanName;
    }

    if (updateData.description !== undefined) {
      const cleanDesc = String(updateData.description).trim();
      if (!cleanDesc) throw ApiError.badRequest('Product description cannot be empty');
      product.description = cleanDesc;
    }

    if (updateData.shortDescription !== undefined) {
      product.shortDescription = String(updateData.shortDescription).trim();
    }

    if (updateData.price !== undefined && updateData.price !== '') {
      const priceNum = Number(updateData.price);
      if (Number.isNaN(priceNum) || priceNum < 0) {
        throw ApiError.badRequest('Price must be 0 or greater');
      }
      product.price = priceNum;
    }

    if (updateData.compareAtPrice !== undefined && updateData.compareAtPrice !== '') {
      const cmp = Number(updateData.compareAtPrice);
      if (Number.isNaN(cmp) || cmp < 0) {
        throw ApiError.badRequest('Compare at price must be 0 or greater');
      }
      product.compareAtPrice = cmp;
    }

    if (updateData.discountPercentage !== undefined && updateData.discountPercentage !== '') {
      const disc = Number(updateData.discountPercentage);
      if (Number.isNaN(disc) || disc < 0 || disc > 100) {
        throw ApiError.badRequest('Discount percentage must be between 0 and 100');
      }
      product.discountPercentage = disc;
    }

    let stockChanged = false;
    let nextStock = prevStock;
    if (updateData.stock !== undefined && updateData.stock !== '') {
      nextStock = Number(updateData.stock);
      if (Number.isNaN(nextStock) || nextStock < 0) {
        throw ApiError.badRequest('Stock must be 0 or greater');
      }
      if (nextStock !== prevStock) {
        stockChanged = true;
        product.stock = nextStock;
      }
    }

    if (updateData.sku !== undefined) {
      product.sku = String(updateData.sku).trim().toUpperCase();
    }

    if (updateData.category !== undefined && updateData.category !== '') {
      ensureValidObjectId(updateData.category, 'Category ID');
      product.category = updateData.category;
    }

    if (updateData.brand !== undefined) {
      if (!updateData.brand) {
        product.brand = undefined;
      } else {
        ensureValidObjectId(updateData.brand, 'Brand ID');
        product.brand = updateData.brand;
      }
    }

    [
      'isFeatured',
      'isTrending',
      'isFlashSale',
      'isBestSeller',
      'isNewArrival',
      'isActive',
    ].forEach((flag) => {
      if (updateData[flag] !== undefined) {
        product[flag] = Boolean(updateData[flag]);
      }
    });

    if (Array.isArray(updateData.tags)) {
      product.tags = updateData.tags;
    }

    if (updateData.status !== undefined && updateData.status !== '') {
      const normalizedStatus = String(updateData.status)
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
      if (!PRODUCT_STATUS_LIST.includes(normalizedStatus)) {
        throw ApiError.badRequest(`Invalid product status: ${updateData.status}`);
      }
      product.status = normalizedStatus;
      if (updateData.isActive === undefined) {
        if (normalizedStatus === PRODUCT_STATUS.PUBLISHED) {
          product.isActive = true;
          product.rejectionReason = '';
        } else if (normalizedStatus === PRODUCT_STATUS.REJECTED) {
          product.isActive = false;
        }
      }
    }

    if (updateData.rejectionReason !== undefined) {
      product.rejectionReason = String(updateData.rejectionReason).trim();
    }

    await product.save({ validateModifiedOnly: true });

    if (stockChanged) {
      await Promise.resolve()
        .then(() =>
          Inventory.findOneAndUpdate(
            { productId: product._id },
            {
              $set: {
                vendorId: product.vendorId,
                quantity: nextStock,
                isOutOfStock: nextStock <= 0,
              },
            },
            { upsert: true, new: true }
          )
        )
        .catch(() => {});

      await Promise.resolve()
        .then(() =>
          StockMovement.create({
            productId: product._id,
            vendorId: product.vendorId,
            type: 'ADJUSTMENT',
            quantity: nextStock - prevStock,
            previousStock: prevStock,
            newStock: nextStock,
            reason: 'Updated via admin product editor',
            performedBy: adminId,
          })
        )
        .catch(() => {});
    }

    return this.getProductById(product._id);
  }

  async updateProductStatus(productId, isActiveOrPayload) {
    ensureValidObjectId(productId, 'Product ID');

    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');

    syncLegacyProductFields(product);
    const payload =
      typeof isActiveOrPayload === 'object' && isActiveOrPayload !== null
        ? isActiveOrPayload
        : { isActive: isActiveOrPayload };

    if (payload.isActive !== undefined) {
      product.isActive = Boolean(payload.isActive);
    }

    if (payload.status !== undefined && payload.status !== '') {
      const normalizedStatus = String(payload.status)
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
      if (!PRODUCT_STATUS_LIST.includes(normalizedStatus)) {
        throw ApiError.badRequest(`Invalid product status: ${payload.status}`);
      }
      product.status = normalizedStatus;
    }

    if (payload.rejectionReason !== undefined) {
      product.rejectionReason = String(payload.rejectionReason).trim();
    }

    await product.save({ validateModifiedOnly: true });
    return this.getProductById(product._id);
  }

  async deleteProduct(productId) {
    ensureValidObjectId(productId, 'Product ID');

    const product = await Product.findByIdAndDelete(productId);
    if (!product) throw ApiError.notFound('Product not found');

    await Promise.resolve()
      .then(() => Inventory.findOneAndDelete({ productId: product._id }))
      .catch(() => {});

    return {
      message: 'Product deleted successfully',
      deletedProductId: product._id,
    };
  }
}

export const adminProductService = new AdminProductService();
export default adminProductService;
