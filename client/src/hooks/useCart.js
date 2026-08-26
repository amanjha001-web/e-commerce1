import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
} from "../store/slices/cartSlice";

const useCart = () => {
  const dispatch = useDispatch();

  const {
    items = [],
    subtotal = 0,
    discount = 0,
    tax = 0,
    shipping = 0,
    total = 0,
    coupon = null,
    isLoading,
    error,
  } = useSelector((state) => state.cart);

  const handleFetchCart = useCallback(() => {
    return dispatch(fetchCart());
  }, [dispatch]);

  const handleAddToCart = useCallback(
    (productId, quantity = 1, variant = null) => {
      return dispatch(
        addToCart({
          productId,
          quantity,
          variant,
        }),
      );
    },
    [dispatch],
  );

  const handleUpdateCartItem = useCallback(
    (productId, quantity, variant = null) => {
      return dispatch(
        updateCartItem({
          productId,
          quantity,
          variant,
        }),
      );
    },
    [dispatch],
  );

  const handleRemoveFromCart = useCallback(
    (productId, variant = null) => {
      return dispatch(
        removeFromCart({
          productId,
          variant,
        }),
      );
    },
    [dispatch],
  );

  const handleClearCart = useCallback(() => {
    return dispatch(clearCart());
  }, [dispatch]);

  const handleApplyCoupon = useCallback(
    (couponCode) => {
      return dispatch(applyCoupon(couponCode));
    },
    [dispatch],
  );

  const handleRemoveCoupon = useCallback(() => {
    return dispatch(removeCoupon());
  }, [dispatch]);

  const cartCount = items.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0,
  );

  const isEmpty = items.length === 0;

  const getCartItem = useCallback(
    (productId) => {
      return items.find(
        (item) =>
          item.productId === productId ||
          item.product?._id === productId ||
          item.product?.id === productId,
      );
    },
    [items],
  );

  const isInCart = useCallback(
    (productId) => {
      return Boolean(getCartItem(productId));
    },
    [getCartItem],
  );

  return {
    items,
    subtotal,
    discount,
    tax,
    shipping,
    total,
    coupon,

    isLoading,
    error,

    cartCount,
    isEmpty,

    fetchCart: handleFetchCart,
    addToCart: handleAddToCart,
    updateCartItem: handleUpdateCartItem,
    removeFromCart: handleRemoveFromCart,
    clearCart: handleClearCart,
    applyCoupon: handleApplyCoupon,
    removeCoupon: handleRemoveCoupon,

    getCartItem,
    isInCart,
  };
};

export default useCart;
