import mongoose from 'mongoose';
import { Inventory } from '../../models/Inventory.model.js';
import { Product } from '../../models/Product.model.js';
import { StockMovement } from '../../models/StockMovement.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';

const ensureValidObjectId = (id, label = 'Product ID') => {
  if (!id || !mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
};

export class AdminInventoryService {
  async getInventory(params = {}) {
    const { page, limit, skip } = parsePagination(params);

    const [items, total] = await Promise.all([
      Inventory.find()
        .populate('productId', 'name slug images price stock')
        .populate('vendorId', 'storeName slug')
        .skip(skip)
        .limit(limit),
      Inventory.countDocuments(),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLowStockInventory(threshold = 10, params = {}) {
    return Inventory.find({ quantity: { $lte: Number(threshold) } })
      .populate('productId', 'name slug images price stock')
      .populate('vendorId', 'storeName slug');
  }

  async getOutOfStockInventory(params = {}) {
    return Inventory.find({ quantity: { $lte: 0 } })
      .populate('productId', 'name slug images price stock')
      .populate('vendorId', 'storeName slug');
  }

  async getInventoryByProductId(productId) {
    ensureValidObjectId(productId, 'Product ID');

    const inv = await Inventory.findOne({ productId })
      .populate('productId', 'name slug images price stock')
      .populate('vendorId', 'storeName slug');

    if (inv) {
      const obj = inv.toObject ? inv.toObject() : { ...inv };
      return {
        ...obj,
        stock: obj.quantity ?? obj.productId?.stock ?? 0,
      };
    }

    // Fallback for products created before Inventory record initialization
    const product = await Product.findById(productId).select('name slug price stock vendorId');
    if (!product) throw ApiError.notFound('Inventory record not found');

    const currentStock = Number(product.stock ?? 0);
    return {
      productId: product._id,
      vendorId: product.vendorId,
      quantity: currentStock,
      stock: currentStock,
      isOutOfStock: currentStock <= 0,
      lowStockThreshold: 10,
    };
  }

  async adjustInventoryStock(productId, payload = {}, adminId) {
    ensureValidObjectId(productId, 'Product ID');

    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');

    const rawAdjustment = payload.stock !== undefined ? payload.stock : payload.quantity;
    if (rawAdjustment === undefined || rawAdjustment === '' || Number.isNaN(Number(rawAdjustment))) {
      throw ApiError.badRequest('A numeric stock quantity is required');
    }

    const prevStock = Number(product.stock || 0);
    const numericAdjustment = Number(rawAdjustment);
    const mode = payload.mode === 'delta' ? 'delta' : 'set';
    const newStock = mode === 'delta' ? prevStock + numericAdjustment : numericAdjustment;

    if (newStock < 0) {
      throw ApiError.badRequest(
        `Resulting stock cannot be negative (current stock: ${prevStock}, adjustment: ${numericAdjustment})`
      );
    }

    product.stock = newStock;
    await product.save({ validateModifiedOnly: true });

    const inv = await Inventory.findOneAndUpdate(
      { productId: product._id },
      {
        $set: {
          vendorId: product.vendorId,
          quantity: newStock,
          isOutOfStock: newStock <= 0,
        },
      },
      { upsert: true, new: true }
    );

    await StockMovement.create({
      productId: product._id,
      vendorId: product.vendorId,
      type: 'ADJUSTMENT',
      quantity: newStock - prevStock,
      previousStock: prevStock,
      newStock,
      reason: String(payload.reason || '').trim() || 'Admin manual adjustment',
      performedBy: adminId,
    });

    const obj = inv?.toObject ? inv.toObject() : { ...(inv || {}) };
    return {
      ...obj,
      quantity: newStock,
      stock: newStock,
      previousStock: prevStock,
      isOutOfStock: newStock <= 0,
    };
  }

  async getInventoryMovements(productId, params = {}) {
    ensureValidObjectId(productId, 'Product ID');

    return StockMovement.find({ productId })
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(params.limit ? Number(params.limit) : 50);
  }
}

export const adminInventoryService = new AdminInventoryService();
export default adminInventoryService;
