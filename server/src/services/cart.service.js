import ApiError from "../utils/ApiError.js";

import cartRepository from "../repositories/cart.repository.js";
import productRepository from "../repositories/product.repository.js";


/*                               Helper Functions                             */


const calculateCartTotals = (items = []) => {
  let totalItems = 0;
  let totalPrice = 0;

  for (const item of items) {
    totalItems += item.quantity;
    totalPrice += item.quantity * item.priceAtPurchase;
  }

  return {
    totalItems,
    totalPrice: Number(totalPrice.toFixed(2)),
  };
};

const validateQuantity = (quantity) => {
  const qty = Number(quantity);

  if (!Number.isInteger(qty) || qty <= 0) {
    throw new ApiError(400, "Quantity must be greater than zero");
  }

  return qty;
};

const validateProduct = async (productId, quantity) => {
  const product = await productRepository.getProductById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (product.deletedAt) {
    throw new ApiError(400, "Product has been removed");
  }

  if (!product.isActive) {
    throw new ApiError(400, "Product is inactive");
  }

  if (product.status !== "published") {
    throw new ApiError(400, "Product is not available");
  }

  if (product.stock <= 0) {
    throw new ApiError(400, "Product is out of stock");
  }

  if (product.stock < quantity) {
    throw new ApiError(400, `Only ${product.stock} item(s) available`);
  }

  return product;
};

const getCurrentPrice = (product) => {
  if (
    product.discountPrice &&
    Number(product.discountPrice) > 0 &&
    Number(product.discountPrice) < Number(product.price)
  ) {
    return Number(product.discountPrice);
  }

  return Number(product.price);
};


/*                               Add To Cart                                  */


const addToCart = async (userId, productId, quantity) => {
  quantity = validateQuantity(quantity);

  const product = await validateProduct(productId, quantity);

  let cart = await cartRepository.getCartByUserId(userId);

  if (!cart) {
    cart = await cartRepository.createCart({
      user: userId,
      items: [],
      totalItems: 0,
      totalPrice: 0,
    });
  }

  const existingItem = cart.items.find(
    (item) => item.product._id.toString() === productId.toString(),
  );

  if (existingItem) {
    const finalQuantity = existingItem.quantity + quantity;

    if (finalQuantity > product.stock) {
      throw new ApiError(400, `Maximum available quantity is ${product.stock}`);
    }

    existingItem.quantity = finalQuantity;

    existingItem.priceAtPurchase = getCurrentPrice(product);
  } else {
    cart.items.push({
      product: product._id,
      quantity,
      priceAtPurchase: getCurrentPrice(product),
    });
  }

  const totals = calculateCartTotals(cart.items);

  return await cartRepository.updateCart(userId, {
    items: cart.items,
    totalItems: totals.totalItems,
    totalPrice: totals.totalPrice,
  });
};

/*                          Refresh Cart (Auto Sync)                          */


const refreshCart = async (userId) => {
  const cart = await cartRepository.getCartByUserId(userId);

  if (!cart) {
    return null;
  }

  const updatedItems = [];

  for (const item of cart.items) {
    const product = await productRepository.getProductById(
      item.product._id,
    );

    if (
      !product ||
      !product.isActive ||
      product.deletedAt ||
      product.status !== "published" ||
      product.stock <= 0
    ) {
      continue;
    }

    const quantity = Math.min(
      item.quantity,
      product.stock,
    );

    updatedItems.push({
      product: product._id,
      quantity,
      priceAtPurchase:
        getCurrentPrice(product),
    });
  }

  const totals = calculateCartTotals(
    updatedItems,
  );

  return await cartRepository.updateCart(
    userId,
    {
      items: updatedItems,
      totalItems: totals.totalItems,
      totalPrice: totals.totalPrice,
    },
  );
};


/*                               Get My Cart                                  */


const getMyCart = async (userId) => {
  let cart = await cartRepository.getCartByUserId(
    userId,
  );

  if (!cart) {
    cart = await cartRepository.createCart({
      user: userId,
      items: [],
      totalItems: 0,
      totalPrice: 0,
    });
  }

  cart = await refreshCart(userId);

  return cart;
};

/*                           Update Cart Item                                 */


const updateCartItem = async (
  userId,
  productId,
  quantity,
) => {
  quantity = validateQuantity(quantity);

  const cart = await cartRepository.getCartByUserId(userId);

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const cartItem = cart.items.find(
    (item) =>
      item.product._id.toString() ===
      productId.toString(),
  );

  if (!cartItem) {
    throw new ApiError(
      404,
      "Product not found in cart",
    );
  }

  const product = await validateProduct(
    productId,
    quantity,
  );

  cartItem.quantity = quantity;

  cartItem.priceAtPurchase =
    getCurrentPrice(product);

  const totals = calculateCartTotals(
    cart.items,
  );

  return await cartRepository.updateCart(
    userId,
    {
      items: cart.items,
      totalItems: totals.totalItems,
      totalPrice: totals.totalPrice,
    },
  );
};


/*                         Remove Item From Cart                              */


const removeCartItem = async (
  userId,
  productId,
) => {
  const cart = await cartRepository.getCartByUserId(
    userId,
  );

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const exists = cart.items.some(
    (item) =>
      item.product._id.toString() ===
      productId.toString(),
  );

  if (!exists) {
    throw new ApiError(
      404,
      "Product not found in cart",
    );
  }

  cart.items = cart.items.filter(
    (item) =>
      item.product._id.toString() !==
      productId.toString(),
  );

  const totals = calculateCartTotals(
    cart.items,
  );

  return await cartRepository.updateCart(
    userId,
    {
      items: cart.items,
      totalItems: totals.totalItems,
      totalPrice: totals.totalPrice,
    },
  );
};

/*                               Clear Cart                                   */


const clearCart = async (userId) => {
  const cart = await cartRepository.getCartByUserId(userId);

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  return await cartRepository.updateCart(userId, {
    items: [],
    totalItems: 0,
    totalPrice: 0,
  });
};


/*                           Merge Guest Cart                                 */


const mergeGuestCart = async (userId, guestItems = []) => {
  if (!Array.isArray(guestItems) || guestItems.length === 0) {
    return await getMyCart(userId);
  }

  let cart = await cartRepository.getCartByUserId(userId);

  if (!cart) {
    cart = await cartRepository.createCart({
      user: userId,
      items: [],
      totalItems: 0,
      totalPrice: 0,
    });
  }

  for (const guestItem of guestItems) {
    const quantity = validateQuantity(guestItem.quantity);

    const product = await validateProduct(
      guestItem.product,
      quantity,
    );

    const existingItem = cart.items.find(
      (item) =>
        item.product._id.toString() ===
        product._id.toString(),
    );

    if (existingItem) {
      existingItem.quantity = Math.min(
        existingItem.quantity + quantity,
        product.stock,
      );

      existingItem.priceAtPurchase =
        getCurrentPrice(product);
    } else {
      cart.items.push({
        product: product._id,
        quantity: Math.min(quantity, product.stock),
        priceAtPurchase: getCurrentPrice(product),
      });
    }
  }

  const totals = calculateCartTotals(cart.items);

  return await cartRepository.updateCart(userId, {
    items: cart.items,
    totalItems: totals.totalItems,
    totalPrice: totals.totalPrice,
  });
};


/*                                   Export                                   */


export default {
  addToCart,
  getMyCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  refreshCart,
  mergeGuestCart,
};