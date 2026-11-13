import { Inventory } from '../../models/Inventory.model.js';
import { Product } from '../../models/Product.model.js';
import { StockMovement } from '../../models/StockMovement.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';

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
    const inv = await Inventory.findOne({ productId })
      .populate('productId')
      .populate('vendorId', 'storeName slug');
    if (!inv) throw ApiError.notFound('Inventory record not found');
    return inv;
  }

  async adjustInventoryStock(productId, payload, adminId) {
    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');

    const adjustment = payload.stock !== undefined ? payload.stock : payload.quantity;
    const prevStock = product.stock;
    const newStock = Number(adjustment);

    product.stock = newStock;
    await product.save();

    const inv = await Inventory.findOneAndUpdate(
      { productId },
      { quantity: newStock, isOutOfStock: newStock === 0 },
      { upsert: true, new: true }
    );

    await StockMovement.create({
      productId,
      vendorId: product.vendorId,
      type: 'ADJUSTMENT',
      quantity: newStock - prevStock,
      previousStock: prevStock,
      newStock,
      reason: payload.reason || 'Admin manual adjustment',
      performedBy: adminId,
    });

    return inv;
  }

  async getInventoryMovements(productId, params = {}) {
    return StockMovement.find({ productId })
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(params.limit ? Number(params.limit) : 50);
  }
}

export const adminInventoryService = new AdminInventoryService();
export default adminInventoryService;
