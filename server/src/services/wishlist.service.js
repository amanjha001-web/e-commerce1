import ApiError from "../utils/ApiError.js";

import wishlistRepository from "../repositories/wishlist.repository.js";
import productRepository from "../repositories/product.repository.js";

/*                           Helper Function                                  */

const validateProduct = async (productId) => {
  const product = await productRepository.getProductById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (!product.isActive) {
    throw new ApiError(400, "Product is not available");
  }

  if (product.isDeleted) {
    throw new ApiError(400, "Product has been removed");
  }

  return product;
};

/*                           Add To Wishlist                                  */

const addToWishlist = async (userId, productId) => {
  const product = await validateProduct(productId);

  let wishlist = await wishlistRepository.getWishlistByUserId(userId);

  if (!wishlist) {
    wishlist = await wishlistRepository.createWishlist({
      user: userId,
      products: [],
    });
  }

  const exists = wishlist.products.some(
    (item) => item._id.toString() === productId.toString(),
  );

  if (exists) {
    throw new ApiError(409, "Product already exists in wishlist");
  }

  wishlist.products.push(product._id);

  return await wishlistRepository.updateWishlist(userId, {
    products: wishlist.products,
  });
};

/*                            Get Wishlist                                    */

const getWishlist = async (userId) => {
  const wishlist = await wishlistRepository.getWishlistByUserId(userId);

  if (!wishlist) {
    return {
      user: userId,
      products: [],
      totalProducts: 0,
    };
  }

  return {
    ...wishlist.toObject(),
    totalProducts: wishlist.products.length,
  };
};
import cartRepository from "../repositories/cart.repository.js";

/*                        Remove From Wishlist                                */

const removeFromWishlist = async (userId, productId) => {
  const wishlist = await wishlistRepository.getWishlistByUserId(userId);

  if (!wishlist) {
    throw new ApiError(404, "Wishlist not found");
  }

  const exists = wishlist.products.some(
    (item) => item._id.toString() === productId.toString(),
  );

  if (!exists) {
    throw new ApiError(404, "Product not found in wishlist");
  }

  wishlist.products = wishlist.products.filter(
    (item) => item._id.toString() !== productId.toString(),
  );

  return await wishlistRepository.updateWishlist(userId, {
    products: wishlist.products,
  });
};

/*                           Clear Wishlist                                   */

const clearWishlist = async (userId) => {
  const wishlist = await wishlistRepository.getWishlistByUserId(userId);

  if (!wishlist) {
    throw new ApiError(404, "Wishlist not found");
  }

  return await wishlistRepository.updateWishlist(userId, {
    products: [],
  });
};

/*                      Move Wishlist Item To Cart                            */

const moveToCart = async (userId, productId) => {
  const product = await validateProduct(productId);

  let cart = await cartRepository.getCartByUserId(userId);

  if (!cart) {
    cart = await cartRepository.createCart({
      user: userId,
      items: [],
    });
  }

  const existingItem = cart.items.find(
    (item) => item.product._id.toString() === productId.toString(),
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.items.push({
      product: product._id,
      quantity: 1,
      priceAtPurchase:
        product.discountPrice > 0 ? product.discountPrice : product.price,
    });
  }

  await cartRepository.updateCart(userId, {
    items: cart.items,
  });

  await removeFromWishlist(userId, productId);

  return {
    success: true,
    message: "Product moved to cart successfully",
  };
};

/*                                  Export                                    */

export default {
  addToWishlist,

  getWishlist,

  removeFromWishlist,

  clearWishlist,

  moveToCart,
};