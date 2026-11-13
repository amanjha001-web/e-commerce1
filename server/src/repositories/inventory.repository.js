import { BaseRepository } from './base.repository.js';
import { Inventory } from '../models/Inventory.model.js';
import { StockMovement } from '../models/StockMovement.model.js';

export class InventoryRepository extends BaseRepository {
  constructor() {
    super(Inventory);
  }

  async findByProduct(productId, variantId = null) {
    return this.model.findOne({ productId, variantId });
  }

  async logStockMovement(data) {
    return StockMovement.create(data);
  }

  async getMovements(productId, options = {}) {
    return StockMovement.find({ productId }).sort({ createdAt: -1 }).limit(options.limit || 50);
  }
}

export const inventoryRepository = new InventoryRepository();
export default inventoryRepository;
