import { Inventory } from '../../models/Inventory.model.js';
import { Product } from '../../models/Product.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { StockMovement } from '../../models/StockMovement.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';

export class VendorInventoryService {
  async getVendorId(userId) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw ApiError.notFound('Vendor profile not found');
    return vendor._id;
  }

  async getInventory(userId, params = {}) {
    const vendorId = await this.getVendorId(userId);
    const { page, limit, skip } = parsePagination(params);

    const [items, total] = await Promise.all([
      Inventory.find({ vendorId })
        .populate('productId', 'name slug images price stock')
        .skip(skip)
        .limit(limit),
      Inventory.countDocuments({ vendorId }),
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

  async updateInventory(userId, productId, { quantity }) {
    const vendorId = await this.getVendorId(userId);
    const product = await Product.findOne({ _id: productId, vendorId });
    if (!product) throw ApiError.notFound('Product not found or not owned by you');

    const prevStock = product.stock;
    product.stock = Number(quantity);
    await product.save();

    const inv = await Inventory.findOneAndUpdate(
      { productId, vendorId },
      { quantity: Number(quantity), isOutOfStock: Number(quantity) === 0 },
      { upsert: true, new: true }
    );

    await StockMovement.create({
      productId,
      vendorId,
      type: 'ADJUSTMENT',
      quantity: Number(quantity) - prevStock,
      previousStock: prevStock,
      newStock: Number(quantity),
      reason: 'Direct inventory adjustment by vendor',
      performedBy: userId,
    });

    return inv;
  }
}

export const vendorInventoryService = new VendorInventoryService();
export default vendorInventoryService;
