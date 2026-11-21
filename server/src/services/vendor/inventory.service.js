import mongoose from 'mongoose';
import { Inventory } from '../../models/Inventory.model.js';
import { Product } from '../../models/Product.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { StockMovement } from '../../models/StockMovement.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';

const DEFAULT_THRESHOLD = 10;

const ensureValidObjectId = (id, label = 'Product ID') => {
  if (!id || !mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
};

const isModelQueryable = (model, method = 'find') =>
  mongoose.connection?.readyState === 1 || Boolean(model?.[method]?.mock);

const normalizeInventoryStatus = (raw) => {
  const clean = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (!clean || clean === 'all' || clean === 'all_statuses') return '';
  if (clean === 'instock' || clean === 'in_stock') return 'in_stock';
  if (clean === 'lowstock' || clean === 'low_stock') return 'low_stock';
  if (clean === 'outofstock' || clean === 'out_of_stock') return 'out_of_stock';
  return clean;
};

const formatInventoryEntry = ({ prod, inv, vendorId }) => {
  const productObj = prod && typeof prod === 'object' ? prod : null;
  const productIdValue = productObj?._id || inv?.productId?._id || inv?.productId || null;

  const quantity = Number(inv?.quantity ?? productObj?.stock ?? 0);
  const reservedQuantity = Math.max(0, Number(inv?.reservedQuantity ?? 0));
  const availableStock = Math.max(0, quantity - reservedQuantity);
  const lowStockThreshold = Math.max(0, Number(inv?.lowStockThreshold ?? DEFAULT_THRESHOLD));
  const stockStatus =
    availableStock <= 0
      ? 'out_of_stock'
      : availableStock <= lowStockThreshold
        ? 'low_stock'
        : 'in_stock';

  return {
    _id: inv?._id || productIdValue,
    productId: productObj
      ? {
          _id: productObj._id,
          name: productObj.name,
          slug: productObj.slug,
          sku: productObj.sku || '',
          images: productObj.images || [],
          price: Number(productObj.price || 0),
          stock: quantity,
          status: productObj.status,
          category: productObj.category || null,
        }
      : productIdValue,
    vendorId: inv?.vendorId || vendorId,
    quantity,
    reservedQuantity,
    availableStock,
    lowStockThreshold,
    isOutOfStock: availableStock <= 0,
    stockStatus,
    updatedAt: inv?.updatedAt || productObj?.updatedAt || productObj?.createdAt || null,
    createdAt: inv?.createdAt || productObj?.createdAt || null,
  };
};

export class VendorInventoryService {
  async getVendorContext(userId) {
    const vendor = await Vendor.findOne({ $or: [{ userId }, { user: userId }] });
    if (!vendor) throw ApiError.notFound('Vendor profile not found');

    const legacyRefs = Array.from(
      new Set([vendor._id, vendor.userId, vendor.user, userId].filter(Boolean).map(String))
    );
    return {
      vendor,
      vendorId: vendor._id,
      ownerFilter: { $or: [{ vendorId: vendor._id }, { vendor: { $in: legacyRefs } }] },
    };
  }

  async getVendorId(userId) {
    const { vendorId } = await this.getVendorContext(userId);
    return vendorId;
  }

  async getInventory(userId, params = {}) {
    const { vendorId, ownerFilter } = await this.getVendorContext(userId);
    const { page, limit, skip } = parsePagination(params);

    const [products, inventoryDocs] = await Promise.all([
      isModelQueryable(Product, 'find')
        ? Product.find(ownerFilter)
            .populate('category', 'name slug')
            .select('name slug sku images price stock status category isActive createdAt updatedAt')
            .sort({ createdAt: -1 })
            .lean()
        : Promise.resolve([]),
      isModelQueryable(Inventory, 'find')
        ? Inventory.find({ vendorId })
            .populate({
              path: 'productId',
              select: 'name slug sku images price stock status category createdAt updatedAt',
              populate: { path: 'category', select: 'name slug' },
            })
            .lean()
        : Promise.resolve([]),
    ]);

    const invByProductId = new Map();
    for (const inv of inventoryDocs || []) {
      const pid = inv?.productId?._id || inv?.productId;
      if (pid) invByProductId.set(String(pid), inv);
    }

    const mergedByProductId = new Map();
    for (const prod of products || []) {
      if (!prod?._id) continue;
      const key = String(prod._id);
      mergedByProductId.set(
        key,
        formatInventoryEntry({
          prod,
          inv: invByProductId.get(key) || null,
          vendorId,
        })
      );
    }

    for (const inv of inventoryDocs || []) {
      const prodObj = inv?.productId && typeof inv.productId === 'object' ? inv.productId : null;
      const pid = prodObj?._id || inv?.productId;
      if (!pid) continue;
      const key = String(pid);
      if (!mergedByProductId.has(key)) {
        mergedByProductId.set(
          key,
          formatInventoryEntry({ prod: prodObj, inv, vendorId })
        );
      }
    }

    const allItems = Array.from(mergedByProductId.values());

    const summary = {
      total: allItems.length,
      inStock: allItems.filter((i) => i.stockStatus === 'in_stock').length,
      lowStock: allItems.filter((i) => i.stockStatus === 'low_stock').length,
      outOfStock: allItems.filter((i) => i.stockStatus === 'out_of_stock').length,
      totalUnits: allItems.reduce((sum, i) => sum + Number(i.availableStock || 0), 0),
      totalInventoryValue:
        Math.round(
          allItems.reduce(
            (sum, i) => sum + Number(i.availableStock || 0) * Number(i.productId?.price || 0),
            0
          ) * 100
        ) / 100,
    };

    const statusFilter = normalizeInventoryStatus(params.status);
    const searchQuery = String(params.search || '').trim().toLowerCase();

    let filtered = allItems.filter((item) => {
      if (statusFilter && item.stockStatus !== statusFilter) return false;
      if (searchQuery) {
        const prod = item.productId || {};
        const haystack = `${prod.name || ''} ${prod.sku || ''} ${prod.category?.name || ''}`.toLowerCase();
        if (!haystack.includes(searchQuery)) return false;
      }
      return true;
    });

    const sortKey = String(params.sortBy || params.sort || 'latest').toLowerCase();
    filtered = [...filtered].sort((a, b) => {
      if (sortKey === 'stock_asc' || sortKey === 'lowest') {
        return a.availableStock - b.availableStock;
      }
      if (sortKey === 'stock_desc' || sortKey === 'highest') {
        return b.availableStock - a.availableStock;
      }
      if (sortKey === 'name_asc' || sortKey === 'a-z') {
        return String(a.productId?.name || '').localeCompare(String(b.productId?.name || ''));
      }
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeB - timeA;
    });

    const total = filtered.length;
    const pagedItems = filtered.slice(skip, skip + limit);

    return {
      items: pagedItems,
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async updateInventory(userId, productId, payload = {}) {
    ensureValidObjectId(productId, 'Product ID');
    const { vendorId, ownerFilter } = await this.getVendorContext(userId);
    const product = await Product.findOne({ _id: productId, ...ownerFilter });
    if (!product) throw ApiError.notFound('Product not found or not owned by you');

    const rawQty = payload.quantity !== undefined ? payload.quantity : payload.stock;
    const rawThreshold =
      payload.lowStockThreshold !== undefined ? payload.lowStockThreshold : payload.threshold;

    if (rawQty === undefined && rawThreshold === undefined) {
      throw ApiError.badRequest('Quantity or low stock threshold is required');
    }

    const prevStock = Number(product.stock || 0);
    let newStock = prevStock;
    let stockChanged = false;

    if (rawQty !== undefined && rawQty !== '') {
      const numericQty = Number(rawQty);
      if (!Number.isFinite(numericQty) || !Number.isInteger(numericQty)) {
        throw ApiError.badRequest('Stock quantity must be a whole number');
      }
      const mode = String(payload.mode || 'set').toLowerCase();
      newStock = mode === 'delta' ? prevStock + numericQty : numericQty;
      if (newStock < 0) {
        throw ApiError.badRequest(
          `Resulting stock cannot be negative (current: ${prevStock}, adjustment: ${numericQty})`
        );
      }
      product.stock = newStock;
      await product.save({ validateModifiedOnly: true });
      stockChanged = newStock !== prevStock || mode === 'set';
    }

    const updateSet = {
      vendorId,
      quantity: newStock,
      isOutOfStock: newStock <= 0,
    };

    if (rawThreshold !== undefined && rawThreshold !== '') {
      const numericThreshold = Number(rawThreshold);
      if (!Number.isFinite(numericThreshold) || numericThreshold < 0) {
        throw ApiError.badRequest('Low stock threshold cannot be negative');
      }
      updateSet.lowStockThreshold = Math.trunc(numericThreshold);
    }

    const inv = await Inventory.findOneAndUpdate(
      { productId: product._id },
      { $set: updateSet },
      { upsert: true, new: true }
    );

    if (stockChanged && (newStock !== prevStock || payload.reason)) {
      const diff = newStock - prevStock;
      await StockMovement.create({
        productId: product._id,
        vendorId,
        type: diff > 0 && payload.mode === 'delta' ? 'IN' : diff < 0 && payload.mode === 'delta' ? 'OUT' : 'ADJUSTMENT',
        quantity: diff,
        previousStock: prevStock,
        newStock,
        reason: String(payload.reason || '').trim() || 'Direct inventory adjustment by vendor',
        performedBy: userId,
      });
    }

    const invObj = inv?.toObject ? inv.toObject() : { ...(inv || {}) };
    return {
      ...invObj,
      previousStock: prevStock,
      quantity: newStock,
      availableStock: Math.max(0, newStock - Number(invObj.reservedQuantity || 0)),
    };
  }

  async getInventoryMovements(userId, productId, params = {}) {
    ensureValidObjectId(productId, 'Product ID');
    const { ownerFilter } = await this.getVendorContext(userId);
    const product = await Product.findOne({ _id: productId, ...ownerFilter }).select('_id name sku');
    if (!product) throw ApiError.notFound('Product not found or not owned by you');

    const safeLimit = Math.min(Math.max(Number(params.limit) || 50, 1), 100);
    return StockMovement.find({ productId: product._id })
      .populate('performedBy', 'fullName name email role')
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean();
  }
}

export const vendorInventoryService = new VendorInventoryService();
export default vendorInventoryService;
