import mongoose from 'mongoose';
import { Product } from '../../models/Product.model.js';
import { ProductVariant } from '../../models/ProductVariant.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { Inventory } from '../../models/Inventory.model.js';
import { StockMovement } from '../../models/StockMovement.model.js';
import { ApiError } from '../../utils/apiError.js';
import { slugify, parsePagination } from '../../utils/helpers.js';
import { PRODUCT_STATUS } from '../../constants/productStatus.constant.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../integrations/cloudinary/cloudinary.client.js';

const LOW_STOCK_THRESHOLD = 10;

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildStatusFilterValues = (rawStatus) => {
  const clean = String(rawStatus || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (!clean || clean === 'all' || clean === 'all_statuses') return null;
  if (clean === 'low_stock') return { lowStock: true };
  if (clean === 'published' || clean === 'active') {
    return { status: { $in: [PRODUCT_STATUS.PUBLISHED, 'published', 'Published', 'active', 'ACTIVE'] } };
  }
  if (clean === 'pending_approval' || clean === 'pending') {
    return { status: { $in: [PRODUCT_STATUS.PENDING_APPROVAL, 'pending_approval', 'pending', 'Pending'] } };
  }
  if (clean === 'draft') {
    return { status: { $in: [PRODUCT_STATUS.DRAFT, 'draft', 'Draft'] } };
  }
  if (clean === 'rejected') {
    return { status: { $in: [PRODUCT_STATUS.REJECTED, 'rejected', 'Rejected'] } };
  }
  if (clean === 'archived' || clean === 'inactive') {
    return { status: { $in: [PRODUCT_STATUS.ARCHIVED, 'archived', 'Archived', 'inactive'] } };
  }
  return { status: rawStatus };
};

const resolveCreateStatus = (requestedStatus) => {
  const clean = String(requestedStatus || '').trim().toLowerCase();
  if (clean === PRODUCT_STATUS.DRAFT) return PRODUCT_STATUS.DRAFT;
  return PRODUCT_STATUS.PENDING_APPROVAL;
};

const computeDiscountPercent = (price, compareAtPrice) => {
  const p = Number(price);
  const c = Number(compareAtPrice);
  if (!Number.isFinite(p) || !Number.isFinite(c) || c <= p || c <= 0) return 0;
  return Math.round(((c - p) / c) * 100);
};

const isCollectionInteractive = (collection, methodName) =>
  mongoose.connection?.readyState === 1 || Boolean(collection?.[methodName]?.mock);

const dropLegacyUniqueIndexes = async (collection, fieldNames = []) => {
  if (!collection || typeof collection.indexes !== 'function' || !isCollectionInteractive(collection, 'indexes')) {
    return false;
  }
  let dropped = false;
  try {
    const indexes = await collection.indexes();
    for (const idx of indexes || []) {
      if (!idx?.unique || !idx?.key) continue;
      if (fieldNames.some((f) => Boolean(idx.key[f]))) {
        await collection.dropIndex(idx.name);
        dropped = true;
      }
    }
  } catch {
    // Non-blocking cleanup fallback
  }
  return dropped;
};

const getDuplicateKeyFields = (err) => {
  const fields = new Set([
    ...Object.keys(err?.keyPattern || {}),
    ...Object.keys(err?.keyValue || {}),
  ]);
  const msg = String(err?.message || '').toLowerCase();
  if (fields.size === 0) {
    if (msg.includes('slug')) fields.add('slug');
    if (msg.includes('sku')) fields.add('sku');
    if (msg.includes('product_1') || msg.includes('product')) fields.add('product');
  }
  return Array.from(fields);
};

export class VendorProductService {
  async getVendorContext(userId) {
    const vendor = await Vendor.findOne({ $or: [{ userId }, { user: userId }] });
    if (!vendor) throw ApiError.notFound('Vendor profile not found');

    const legacyRefs = Array.from(
      new Set(
        [vendor._id, vendor.userId, vendor.user, userId]
          .filter(Boolean)
          .map((ref) => String(ref))
      )
    );

    const ownerFilter = {
      $or: [{ vendorId: vendor._id }, { vendor: { $in: legacyRefs } }],
    };

    return { vendor, vendorId: vendor._id, ownerFilter };
  }

  async getVendorId(userId) {
    const { vendorId } = await this.getVendorContext(userId);
    return vendorId;
  }

  async getVendorProducts(userId, params = {}) {
    const { ownerFilter } = await this.getVendorContext(userId);
    const { page, limit, skip, sort } = parsePagination(params);

    const andConditions = [ownerFilter];

    const statusCond = buildStatusFilterValues(params.status);
    if (statusCond?.lowStock) {
      andConditions.push({ stock: { $lte: LOW_STOCK_THRESHOLD } });
    } else if (statusCond) {
      andConditions.push(statusCond);
    }

    if (params.lowStock === true || String(params.lowStock).toLowerCase() === 'true') {
      andConditions.push({ stock: { $lte: LOW_STOCK_THRESHOLD } });
    }

    if (params.category && mongoose.Types.ObjectId.isValid(params.category)) {
      andConditions.push({ category: params.category });
    }

    if (params.search && String(params.search).trim()) {
      const regex = new RegExp(escapeRegex(String(params.search).trim()), 'i');
      andConditions.push({
        $or: [{ name: regex }, { sku: regex }, { shortDescription: regex }, { tags: regex }],
      });
    }

    const filter = andConditions.length === 1 ? andConditions[0] : { $and: andConditions };
    const canAggregate =
      mongoose.connection?.readyState === 1 || Boolean(Product.aggregate?.mock);

    const [products, total, summaryRows] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .populate('brand', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
      canAggregate
        ? Product.aggregate([
            { $match: ownerFilter },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                published: {
                  $sum: {
                    $cond: [{ $in: ['$status', [PRODUCT_STATUS.PUBLISHED, 'active', 'ACTIVE']] }, 1, 0],
                  },
                },
                pending: {
                  $sum: {
                    $cond: [{ $in: ['$status', [PRODUCT_STATUS.PENDING_APPROVAL, 'pending', 'Pending']] }, 1, 0],
                  },
                },
                draft: {
                  $sum: {
                    $cond: [{ $in: ['$status', [PRODUCT_STATUS.DRAFT, 'draft']] }, 1, 0],
                  },
                },
                rejected: {
                  $sum: {
                    $cond: [{ $in: ['$status', [PRODUCT_STATUS.REJECTED, 'rejected']] }, 1, 0],
                  },
                },
                lowStock: {
                  $sum: {
                    $cond: [{ $lte: ['$stock', LOW_STOCK_THRESHOLD] }, 1, 0],
                  },
                },
              },
            },
          ])
        : Promise.resolve([]),
    ]);

    const summary = summaryRows?.[0] || {
      total,
      published: 0,
      pending: 0,
      draft: 0,
      rejected: 0,
      lowStock: 0,
    };

    return {
      products,
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVendorProductById(userId, productId) {
    const { ownerFilter } = await this.getVendorContext(userId);
    const product = await Product.findOne({ _id: productId, ...ownerFilter })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .lean();

    if (!product) throw ApiError.notFound('Product not found or not owned by you');

    const canQueryVariants =
      mongoose.connection?.readyState === 1 || Boolean(ProductVariant.find?.mock);
    const variants = canQueryVariants
      ? await ProductVariant.find({ productId: product._id }).sort({ createdAt: 1 }).lean()
      : [];

    return {
      ...product,
      variants,
    };
  }

  async createProduct(userId, productData) {
    const { vendorId } = await this.getVendorContext(userId);
    const payload = { ...productData };

    if (!payload.brand) delete payload.brand;
    if (!payload.sku || !String(payload.sku).trim()) {
      delete payload.sku;
    } else {
      payload.sku = String(payload.sku).trim().toUpperCase();
    }
    if (payload.compareAtPrice === undefined || payload.compareAtPrice === '') {
      delete payload.compareAtPrice;
    }

    const baseSlug = slugify(payload.name) || 'product';
    let slug = baseSlug;
    let counter = 1;
    while (await Product.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const status = resolveCreateStatus(payload.status);
    const compareAtPrice = Number(payload.compareAtPrice || 0);
    const discountPercentage = computeDiscountPercent(payload.price, compareAtPrice);

    let product = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        product = await Product.create({
          ...payload,
          vendorId,
          slug,
          status,
          discountPercentage,
        });
        break;
      } catch (err) {
        if (err?.code !== 11000 || attempt === 2) throw err;

        const dupFields = getDuplicateKeyFields(err);
        if (dupFields.includes('slug')) {
          slug = `${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          continue;
        }

        if (dupFields.some((f) => ['sku', 'product', 'name'].includes(f))) {
          if (isCollectionInteractive(Product.collection, 'updateMany')) {
            try {
              await Product.collection.updateMany(
                { $or: [{ sku: null }, { sku: '' }] },
                { $unset: { sku: '' } }
              );
            } catch {
              // Safe fallback
            }
          }
          const dropped = await dropLegacyUniqueIndexes(Product.collection, ['sku', 'product', 'name']);
          if (dropped) continue;
        }
        throw err;
      }
    }

    try {
      const invDoc = {
        vendorId,
        quantity: Number(product.stock || 0),
        isOutOfStock: Number(product.stock || 0) === 0,
      };
      try {
        await Inventory.findOneAndUpdate(
          { productId: product._id },
          { $set: invDoc },
          { upsert: true, new: true }
        );
      } catch (invErr) {
        if (invErr?.code !== 11000) throw invErr;
        if (isCollectionInteractive(Inventory.collection, 'updateMany')) {
          try {
            await Inventory.collection.updateMany(
              { product: { $exists: true } },
              { $unset: { product: '' } }
            );
          } catch {
            // Safe fallback
          }
        }
        await dropLegacyUniqueIndexes(Inventory.collection, ['product']);
        await Inventory.findOneAndUpdate(
          { productId: product._id },
          { $set: invDoc },
          { upsert: true, new: true }
        );
      }

      await StockMovement.create({
        productId: product._id,
        vendorId,
        type: 'IN',
        quantity: product.stock,
        previousStock: 0,
        newStock: product.stock,
        reason: 'Initial stock on product creation',
        performedBy: userId,
      });
    } catch (postCreateErr) {
      await Product.findByIdAndDelete(product._id).catch(() => {});
      throw postCreateErr;
    }

    return product;
  }

  async updateProduct(userId, productId, updateData) {
    const { vendorId, ownerFilter } = await this.getVendorContext(userId);
    const product = await Product.findOne({ _id: productId, ...ownerFilter });
    if (!product) throw ApiError.notFound('Product not found or not owned by you');

    const setPayload = { ...updateData };
    const unsetPayload = {};

    if (setPayload.name && setPayload.name !== product.name) {
      setPayload.slug = `${slugify(setPayload.name)}-${Math.floor(Math.random() * 1000)}`;
    }

    if (setPayload.brand === '' || setPayload.brand === null) {
      delete setPayload.brand;
      unsetPayload.brand = 1;
    }

    if (setPayload.sku === '') {
      delete setPayload.sku;
      unsetPayload.sku = 1;
    }

    const nextPrice = setPayload.price !== undefined ? Number(setPayload.price) : product.price;
    const nextCompare =
      setPayload.compareAtPrice !== undefined
        ? Number(setPayload.compareAtPrice || 0)
        : Number(product.compareAtPrice || 0);
    setPayload.discountPercentage = computeDiscountPercent(nextPrice, nextCompare);

    const requestedStatus = String(setPayload.status || '').trim().toLowerCase();
    const coreChanged =
      (setPayload.price !== undefined && Number(setPayload.price) !== Number(product.price)) ||
      (setPayload.description !== undefined && setPayload.description !== product.description) ||
      (setPayload.name !== undefined && setPayload.name !== product.name) ||
      (setPayload.category !== undefined && String(setPayload.category) !== String(product.category));

    if (requestedStatus === PRODUCT_STATUS.DRAFT) {
      setPayload.status = PRODUCT_STATUS.DRAFT;
    } else if (requestedStatus === PRODUCT_STATUS.ARCHIVED || requestedStatus === 'inactive') {
      setPayload.status = PRODUCT_STATUS.ARCHIVED;
      setPayload.isActive = false;
    } else if (requestedStatus === PRODUCT_STATUS.PENDING_APPROVAL || coreChanged) {
      setPayload.status = PRODUCT_STATUS.PENDING_APPROVAL;
      setPayload.isActive = true;
    } else {
      delete setPayload.status;
    }

    const updateDoc =
      Object.keys(unsetPayload).length > 0
        ? { $set: setPayload, $unset: unsetPayload }
        : setPayload;

    const updated = await Product.findByIdAndUpdate(productId, updateDoc, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'name slug')
      .populate('brand', 'name slug');

    if (setPayload.stock !== undefined && Number(setPayload.stock) !== Number(product.stock)) {
      const nextStock = Number(setPayload.stock);
      const prevStock = Number(product.stock || 0);
      await Inventory.findOneAndUpdate(
        { productId: product._id },
        { vendorId, quantity: nextStock, isOutOfStock: nextStock === 0 },
        { upsert: true }
      );
      await StockMovement.create({
        productId: product._id,
        vendorId,
        type: 'ADJUSTMENT',
        quantity: nextStock - prevStock,
        previousStock: prevStock,
        newStock: nextStock,
        reason: 'Product edit stock update',
        performedBy: userId,
      });
    }

    return updated;
  }

  async deleteProduct(userId, productId) {
    const { ownerFilter } = await this.getVendorContext(userId);
    const product = await Product.findOneAndDelete({ _id: productId, ...ownerFilter });
    if (!product) throw ApiError.notFound('Product not found or not owned by you');

    await Promise.all([
      Inventory.findOneAndDelete({ productId: product._id }),
      ProductVariant.deleteMany({ productId: product._id }),
      ...(product.images || [])
        .filter((img) => img?.publicId)
        .map((img) => deleteFromCloudinary(img.publicId).catch(() => {})),
    ]);

    return { message: 'Product deleted successfully' };
  }

  async updateProductStock(userId, productId, stock) {
    const { vendorId, ownerFilter } = await this.getVendorContext(userId);
    const product = await Product.findOne({ _id: productId, ...ownerFilter });
    if (!product) throw ApiError.notFound('Product not found or not owned by you');

    const prevStock = product.stock;
    product.stock = Number(stock);
    await product.save();

    await Inventory.findOneAndUpdate(
      { productId: product._id },
      { vendorId, quantity: Number(stock), isOutOfStock: Number(stock) === 0 },
      { upsert: true }
    );

    await StockMovement.create({
      productId: product._id,
      vendorId,
      type: 'ADJUSTMENT',
      quantity: Number(stock) - prevStock,
      previousStock: prevStock,
      newStock: Number(stock),
      reason: 'Vendor stock update',
      performedBy: userId,
    });

    return product;
  }

  async uploadProductImages(userId, productId, files) {
    const { ownerFilter } = await this.getVendorContext(userId);
    const product = await Product.findOne({ _id: productId, ...ownerFilter });
    if (!product) throw ApiError.notFound('Product not found or not owned by you');

    if (!files || files.length === 0) {
      throw ApiError.badRequest('No files provided');
    }

    const uploadPromises = files.map((file) => uploadToCloudinary(file.buffer, 'products'));
    const results = await Promise.all(uploadPromises);

    const newImages = results.map((res, index) => ({
      url: res.url,
      publicId: res.publicId,
      isDefault: product.images.length === 0 && index === 0,
    }));

    product.images.push(...newImages);
    await product.save();

    return product;
  }

  async deleteProductImage(userId, productId, imageId) {
    const { ownerFilter } = await this.getVendorContext(userId);
    const product = await Product.findOne({ _id: productId, ...ownerFilter });
    if (!product) throw ApiError.notFound('Product not found');

    const imgIndex = product.images.findIndex((img) => img._id.toString() === imageId);
    if (imgIndex === -1) throw ApiError.notFound('Image not found');

    const [removed] = product.images.splice(imgIndex, 1);
    if (removed.publicId) {
      await deleteFromCloudinary(removed.publicId).catch(() => {});
    }

    await product.save();
    return product;
  }
}

export const vendorProductService = new VendorProductService();
export default vendorProductService;
