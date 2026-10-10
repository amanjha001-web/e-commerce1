
import cartService from "../../services/cart.service";

import {
  fetchCartStart,
  fetchCartSuccess,
  fetchCartFailure,
  setCartLoading,
} from "./cartSlice";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

// Handle API responses that contain the updated cart.
const syncCart = async (dispatch, response) => {
  const returnedCart = response?.data;

  if (Array.isArray(returnedCart?.items)) {
    dispatch(fetchCartSuccess(response));
    return returnedCart;
  }

  const latestCart = await cartService.getCart();
  dispatch(fetchCartSuccess(latestCart));

  return latestCart?.data ?? latestCart;
};

// Fetch cart
export const fetchCart = () => async (dispatch) => {
  try {
    dispatch(fetchCartStart());

    const response = await cartService.getCart();

    dispatch(fetchCartSuccess(response));

    return {
      success: true,
      data: response?.data ?? response,
    };
  } catch (error) {
    const message = getErrorMessage(error, "Failed to fetch cart");

    dispatch(fetchCartFailure(message));

    return { success: false, message };
  }
};

// Add product
export const addCartProduct =
  (productId, quantity = 1) =>
  async (dispatch) => {
    if (!productId || !Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
      return {
        success: false,
        message: "Valid product ID and quantity are required",
      };
    }

    try {
      dispatch(setCartLoading(true));

      const response = await cartService.addToCart(
        productId,
        Number(quantity)
      );

      const data = await syncCart(dispatch, response);

      return {
        success: true,
        data,
        message: response?.message || "Product added to cart successfully",
      };
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Failed to add product to cart"
      );

      dispatch(fetchCartFailure(message));

      return { success: false, message };
    } finally {
      dispatch(setCartLoading(false));
    }
  };

// Update product quantity
export const updateCartProduct =
  (productId, quantity) => async (dispatch) => {
    if (
      !productId ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 1
    ) {
      return {
        success: false,
        message: "Valid product ID and quantity are required",
      };
    }

    try {
      dispatch(setCartLoading(true));

      const response = await cartService.updateCartItem(
        productId,
        Number(quantity)
      );

      await syncCart(dispatch, response);

      return {
        success: true,
        message: response?.message || "Cart updated successfully",
      };
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Failed to update cart quantity"
      );

      dispatch(fetchCartFailure(message));

      return { success: false, message };
    } finally {
      dispatch(setCartLoading(false));
    }
  };

// Remove product
export const removeCartProduct =
  (productId) => async (dispatch) => {
    if (!productId) {
      return {
        success: false,
        message: "Product ID is missing",
      };
    }

    try {
      dispatch(setCartLoading(true));

      const response = await cartService.removeCartItem(productId);

      await syncCart(dispatch, response);

      return {
        success: true,
        message: response?.message || "Product removed from cart",
      };
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Failed to remove product from cart"
      );

      dispatch(fetchCartFailure(message));

      return { success: false, message };
    } finally {
      dispatch(setCartLoading(false));
    }
  };

// Clear cart
export const clearCartProducts = () => async (dispatch) => {
  try {
    dispatch(setCartLoading(true));

    await cartService.clearCart();

    const latestCart = await cartService.getCart();

    dispatch(fetchCartSuccess(latestCart));

    return {
      success: true,
      message: "Cart cleared successfully",
    };
  } catch (error) {
    const message = getErrorMessage(error, "Failed to clear cart");

    dispatch(fetchCartFailure(message));

    return { success: false, message };
  } finally {
    dispatch(setCartLoading(false));
  }
};

// Apply coupon
export const applyCartCoupon = (couponCode) => async (dispatch) => {
  if (!couponCode?.trim()) {
    return {
      success: false,
      message: "Coupon code is required",
    };
  }

  try {
    dispatch(setCartLoading(true));

    await cartService.applyCoupon(couponCode.trim());

    const latestCart = await cartService.getCart();

    dispatch(fetchCartSuccess(latestCart));

    return {
      success: true,
      message: "Coupon applied successfully",
    };
  } catch (error) {
    const message = getErrorMessage(error, "Failed to apply coupon");

    dispatch(fetchCartFailure(message));

    return { success: false, message };
  } finally {
    dispatch(setCartLoading(false));
  }
};

// Remove coupon
export const removeCartCoupon = () => async (dispatch) => {
  try {
    dispatch(setCartLoading(true));

    await cartService.removeCoupon();

    const latestCart = await cartService.getCart();

    dispatch(fetchCartSuccess(latestCart));

    return {
      success: true,
      message: "Coupon removed successfully",
    };
  } catch (error) {
    const message = getErrorMessage(error, "Failed to remove coupon");

    dispatch(fetchCartFailure(message));

    return { success: false, message };
  } finally {
    dispatch(setCartLoading(false));
  }
};

// Validate cart
export const validateCart = () => async () => {
  try {
    const response = await cartService.validateCart();

    return {
      success: true,
      data: response?.data ?? response,
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Failed to validate cart"),
    };
  }
};
