
import wishlistService from "../../services/wishlist.service";

import {
  fetchWishlistStart,
  fetchWishlistSuccess,
  fetchWishlistFailure,
  addToWishlistStart,
  addToWishlistSuccess,
  addToWishlistFailure,
  removeFromWishlistStart,
  removeFromWishlistSuccess,
  removeFromWishlistFailure,
  clearWishlistStart,
  clearWishlistSuccess,
  clearWishlistFailure,
} from "./wishlistSlice";

// =========================
// Get Wishlist
// =========================

export const fetchWishlist = () => async (dispatch) => {
  try {
    dispatch(fetchWishlistStart());

    const response = await wishlistService.getWishlist();

    const data = response?.data;

    // Supports the existing products response and
    // a direct array response.
    const products = Array.isArray(data?.products)
      ? data.products
      : Array.isArray(data)
        ? data
        : [];

    dispatch(
      fetchWishlistSuccess({
        products,
      }),
    );

    return products;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch wishlist";

    dispatch(fetchWishlistFailure(message));

    return [];
  }
};

// =========================
// Add Product To Wishlist
// =========================

export const addWishlistProduct = (productId) => async (dispatch) => {
  try {
    dispatch(addToWishlistStart());

    const response =
      await wishlistService.addToWishlist(productId);

    const data = response?.data;

    // Support different common API response shapes.
    const products = Array.isArray(data?.products)
      ? data.products
      : [];

    const addedProduct =
      products.find((item) => {
        const product = item?.product || item;

        const id =
          product?._id ||
          product?.id ||
          item?.productId;

        return String(id || "") === String(productId);
      }) ||
      (data?.product &&
      typeof data.product === "object"
        ? data.product
        : null);

    if (addedProduct) {
      dispatch(addToWishlistSuccess(addedProduct));
    }

    // Re-fetch authoritative backend state after adding.
    await dispatch(fetchWishlist());

    return {
      success: true,
      data,
    };
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to add product to wishlist";

    dispatch(addToWishlistFailure(message));

    return {
      success: false,
      message,
    };
  }
};

// =========================
// Remove Product From Wishlist
// =========================

export const removeWishlistProduct = (productId) => async (dispatch) => {
  try {
    dispatch(removeFromWishlistStart());

    await wishlistService.removeFromWishlist(productId);

    dispatch(removeFromWishlistSuccess(productId));

    return {
      success: true,
    };
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to remove product from wishlist";

    dispatch(removeFromWishlistFailure(message));

    return {
      success: false,
      message,
    };
  }
};

// =========================
// Clear Wishlist
// =========================

export const clearWishlistProducts = () => async (dispatch) => {
  try {
    dispatch(clearWishlistStart());

    await wishlistService.clearWishlist();

    dispatch(clearWishlistSuccess());

    return {
      success: true,
    };
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to clear wishlist";

    dispatch(clearWishlistFailure(message));

    return {
      success: false,
      message,
    };
  }
};
