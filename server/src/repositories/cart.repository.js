import { BaseRepository } from './base.repository.js';
import { Cart } from '../models/Cart.model.js';

export class CartRepository extends BaseRepository {
  constructor() {
    super(Cart);
  }

  async findByUserId(userId) {
    return this.model
      .findOne({ userId })
      .populate('items.product', 'name slug images price stock isActive status vendorId')
      .populate('items.variant', 'title price stock sku attributes');
  }

  async findOrCreate(userId) {
    let cart = await this.findByUserId(userId);
    if (!cart) {
      cart = await this.create({ userId, items: [] });
    }
    return cart;
  }
}

export const cartRepository = new CartRepository();
export default cartRepository;
