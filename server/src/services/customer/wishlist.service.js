import { Wishlist } from '../../models/Wishlist.model.js';
import { Product } from '../../models/Product.model.js';
import { ApiError } from '../../utils/apiError.js';

export class WishlistService {
  async getWishlist(userId) {
    let wishlist = await Wishlist.findOne({ $or: [{ userId }, { user: userId }] }).populate({
      path: 'products',
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'vendorId', select: 'storeName slug' },
      ],
    });

    if (!wishlist) {
      try {
        wishlist = await Wishlist.create({ userId, user: userId, products: [] });
      } catch (err) {
        if (err.code === 11000) {
          wishlist = await Wishlist.findOne({ $or: [{ userId }, { user: userId }] }).populate({
            path: 'products',
            populate: [
              { path: 'category', select: 'name slug' },
              { path: 'vendorId', select: 'storeName slug' },
            ],
          });
        } else {
          throw err;
        }
      }
    }

    if (wishlist && (!wishlist.userId || !wishlist.user)) {
      wishlist.userId = wishlist.userId || wishlist.user || userId;
      wishlist.user = wishlist.user || wishlist.userId || userId;
      await wishlist.save().catch(() => {});
    }

    return wishlist;
  }

  async addToWishlist(userId, productId) {
    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');

    let wishlist = await Wishlist.findOne({ $or: [{ userId }, { user: userId }] });
    if (!wishlist) {
      try {
        wishlist = new Wishlist({ userId, user: userId, products: [] });
      } catch (err) {
        if (err.code === 11000) {
          wishlist = await Wishlist.findOne({ $or: [{ userId }, { user: userId }] });
        } else {
          throw err;
        }
      }
    }

    const prodIdStr = productId.toString();
    const alreadyExists = wishlist.products.some(
      (p) => (p._id || p).toString() === prodIdStr
    );

    if (!alreadyExists) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    return this.getWishlist(userId);
  }

  async removeFromWishlist(userId, productId) {
    const wishlist = await Wishlist.findOne({ $or: [{ userId }, { user: userId }] });
    if (!wishlist) throw ApiError.notFound('Wishlist not found');

    const prodIdStr = productId.toString();
    wishlist.products = wishlist.products.filter(
      (p) => (p._id || p).toString() !== prodIdStr
    );
    await wishlist.save();

    return this.getWishlist(userId);
  }

  async clearWishlist(userId) {
    let wishlist = await Wishlist.findOne({ $or: [{ userId }, { user: userId }] });
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }
    return { message: 'Wishlist cleared successfully' };
  }
}

export const wishlistService = new WishlistService();
export default wishlistService;
