
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import CartList from "../../components/cart/CartList";
import CartSummary from "../../components/cart/CartSummary";
import CartEmpty from "../../components/cart/CartEmpty";
import CartActions from "../../components/cart/CartActions";
import CouponBox from "../../components/cart/CouponBox";
import Loader from "../../components/common/Loader";

import {
  fetchCart,
  clearCartProducts,
  applyCartCoupon,
  removeCartCoupon,
} from "../../store/slices/cartThunk.js";

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    items = [],
    subtotal = 0,
    discount = 0,
    shipping = 0,
    tax = 0,
    total = 0,
    coupon = null,
    loading = false,
    error = null,
  } = useSelector((state) => state.cart || {});

  const [updating, setUpdating] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  // Clear cart
  const handleClearCart = useCallback(async () => {
    if (!items.length || updating) return;

    setUpdating(true);
    setActionError("");

    try {
      const result = await dispatch(clearCartProducts());

      if (!result?.success) {
        setActionError(result?.message || "Unable to clear cart.");
      }
    } catch {
      setActionError("Unable to clear cart. Please try again.");
    } finally {
      setUpdating(false);
    }
  }, [dispatch, items.length, updating]);

  // Apply coupon
  const handleApplyCoupon = useCallback(
    async (couponCode) => {
      const code =
        typeof couponCode === "string"
          ? couponCode.trim()
          : couponCode?.couponCode?.trim?.() ||
            couponCode?.code?.trim?.() ||
            "";

      if (!code) {
        setActionError("Please enter a coupon code.");
        return;
      }

      setApplyingCoupon(true);
      setActionError("");

      try {
        const result = await dispatch(applyCartCoupon(code));

        if (!result?.success) {
          setActionError(result?.message || "Unable to apply coupon.");
        }
      } catch {
        setActionError("Unable to apply coupon. Please try again.");
      } finally {
        setApplyingCoupon(false);
      }
    },
    [dispatch]
  );

  // Remove coupon
  const handleRemoveCoupon = useCallback(async () => {
    setApplyingCoupon(true);
    setActionError("");

    try {
      const result = await dispatch(removeCartCoupon());

      if (!result?.success) {
        setActionError(result?.message || "Unable to remove coupon.");
      }
    } catch {
      setActionError("Unable to remove coupon. Please try again.");
    } finally {
      setApplyingCoupon(false);
    }
  }, [dispatch]);

  const handleContinueShopping = () => navigate("/products");

  const cartItems = items;

  const itemCount = cartItems.reduce(
    (count, item) => count + (Number(item?.quantity) || 0),
    0
  );

  if (loading && cartItems.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">
            Shopping Cart
          </p>

          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            Your Cart
          </h1>
        </div>

        {error && (
          <p role="alert" className="mb-4 text-sm text-red-600">
            {error}
          </p>
        )}

        {actionError && (
          <p role="alert" className="mb-4 text-sm text-red-600">
            {actionError}
          </p>
        )}

        <CartEmpty onContinueShopping={handleContinueShopping} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page heading */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Shopping Cart
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Your Cart
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        <CartActions
          onClearCart={handleClearCart}
          onContinueShopping={handleContinueShopping}
          loading={updating}
        />
      </div>

      {/* Error message */}
      {(actionError || error) && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600"
        >
          {actionError ||
            (typeof error === "string"
              ? error
              : "Unable to load your cart.")}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Cart items and coupon */}
        <section className="min-w-0">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {/* No quantity or remove props required */}
            <CartList
              items={cartItems}
              loading={loading || updating}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="font-semibold">Have a coupon?</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Apply your coupon code before checkout.
              </p>
            </div>

            <CouponBox
              coupon={coupon}
              loading={applyingCoupon}
              onApply={handleApplyCoupon}
              onRemove={handleRemoveCoupon}
            />
          </div>

          <button
            type="button"
            onClick={handleContinueShopping}
            className="mt-6 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            ← Continue Shopping
          </button>
        </section>

        {/* Order summary */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold">
              Order Summary
            </h2>

            <CartSummary
              subtotal={Number(subtotal) || 0}
              discount={Number(discount) || 0}
              shipping={Number(shipping) || 0}
              tax={Number(tax) || 0}
              total={Number(total) || 0}
              coupon={coupon}
            />

            <button
              type="button"
              onClick={() => navigate("/checkout")}
              disabled={
                updating ||
                applyingCoupon ||
                !cartItems.length
              }
              className="mt-6 w-full rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Proceed to Checkout
            </button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Taxes and shipping are calculated according to your order details.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Cart;
