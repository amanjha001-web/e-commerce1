import { Wishlist } from '../../models/Wishlist.model.js';
import { Product } from '../../models/Product.model.js';
import { ApiError } from '../../utils/apiError.js';

export class WishlistService {
  async getWishlist(userId) {
    let wishlist = await Wishlist.findOne({ userId }).populate({
      path: 'products',
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'vendorId', select: 'storeName slug' },
      ],
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, products: [] });
    }

    return wishlist;
  }

  async addToWishlist(userId, productId) {
    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [] });
    }

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    return this.getWishlist(userId);
  }

  async removeFromWishlist(userId, productId) {
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) throw ApiError.notFound('Wishlist not found');

    wishlist.products = wishlist.products.filter(
      (p) => p.toString() !== productId.toString()
    );
    await wishlist.save();

    return this.getWishlist(userId);
  }

  async clearWishlist(userId) {
    let wishlist = await Wishlist.findOne({ userId });
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }
    return { message: 'Wishlist cleared successfully' };
  }
}

export const wishlistService = new WishlistService();
export default wishlistService;
