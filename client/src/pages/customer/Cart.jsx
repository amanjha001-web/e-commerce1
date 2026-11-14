import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
          toast.error(result?.message || "Unable to apply coupon.");
        } else {
          toast.success("Coupon applied successfully!");
        }
      } catch {
        setActionError("Unable to apply coupon. Please try again.");
        toast.error("Unable to apply coupon. Please try again.");
      } finally {
        setApplyingCoupon(false);
      }
    },
    [dispatch],
  );

  // Remove coupon
  const handleRemoveCoupon = useCallback(async () => {
    setApplyingCoupon(true);
    setActionError("");

    try {
      const result = await dispatch(removeCartCoupon());

      if (!result?.success) {
        setActionError(result?.message || "Unable to remove coupon.");
        toast.error(result?.message || "Unable to remove coupon.");
      } else {
        toast.success("Coupon removed successfully");
      }
    } catch {
      setActionError("Unable to remove coupon. Please try again.");
      toast.error("Unable to remove coupon. Please try again.");
    } finally {
      setApplyingCoupon(false);
    }
  }, [dispatch]);

  const handleContinueShopping = () => navigate("/products");

  const cartItems = Array.isArray(items) ? items : [];

  const itemCount = cartItems.reduce(
    (count, item) => count + (Number(item?.quantity) || 0),
    0,
  );

  // Authoritative consistent pricing mapping
  const calculatedSubtotal = cartItems.reduce(
    (sum, item) => sum + (Number(item?.price) || 0) * (Number(item?.quantity) || 1),
    0
  );
  const activeSubtotal = calculatedSubtotal > 0 ? calculatedSubtotal : Number(subtotal) || 0;

  // Authoritative discount derivation: from state discount, coupon.discount, or coupon code (e.g. SAVE15 -> 15%)
  const couponCodeStr = typeof coupon === "string" ? coupon : coupon?.code || "";
  let derivedDiscount = Number(discount) || Number(coupon?.discount) || 0;
  if (derivedDiscount <= 0 && couponCodeStr && activeSubtotal > 0) {
    const codeMatch = String(couponCodeStr).match(/(\d+)/);
    if (codeMatch) {
      const rate = parseFloat(codeMatch[1]) || 0;
      derivedDiscount = rate <= 50 ? (activeSubtotal * rate) / 100 : Math.min(rate, activeSubtotal);
    }
  }
  const activeDiscount = Math.max(0, derivedDiscount);
  const activeShipping = activeSubtotal >= 999 || cartItems.length === 0 ? 0 : (Number(shipping) > 0 ? Number(shipping) : 50);
  const activeTax = Number(tax) || 0;
  const activeTotal = Math.max(0, activeSubtotal - activeDiscount + activeShipping + activeTax);

  if (loading && cartItems.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background text-foreground">
        <Loader />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="page">
        <div className="mb-6">
          <div className="eyebrow">Your bag</div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--text)]">
            Shopping cart
          </h1>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-[#f3cbd0] bg-[#ffeaec] px-4 py-3 text-sm font-bold text-[var(--red)]"
          >
            {error}
          </p>
        )}

        {actionError && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-[#f3cbd0] bg-[#ffeaec] px-4 py-3 text-sm font-bold text-[var(--red)]"
          >
            {actionError}
          </p>
        )}

        <CartEmpty onContinueShopping={handleContinueShopping} />
      </main>
    );
  }

  return (
    <main className="page">
      {/* Page heading */}
      <div className="pagehead">
        <div>
          <div className="eyebrow">Your bag</div>
          <h1>Shopping cart</h1>
          <p className="muted mt-1 mb-0 text-sm">
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
          className="mb-6 rounded-xl border border-[#f3cbd0] bg-[#ffeaec] px-4 py-3 text-sm font-bold text-[var(--red)]"
        >
          {actionError ||
            (typeof error === "string" ? error : "Unable to load your cart.")}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Cart items and coupon */}
        <section className="min-w-0">
          <div className="panel !p-0 overflow-hidden">
            <CartList items={cartItems} loading={loading || updating} />
          </div>

          {/* Coupon section */}
          <div className="panel mt-5">
            <div className="mb-4">
              <h2 className="text-base font-bold text-[var(--text)]">
                Have a coupon?
              </h2>

              <p className="muted mt-1 text-xs">
                Apply your coupon code before checkout.
              </p>
            </div>

            <CouponBox
              appliedCoupon={coupon}
              coupon={coupon}
              discount={activeDiscount}
              loading={applyingCoupon}
              error={actionError}
              onApply={handleApplyCoupon}
              onRemove={handleRemoveCoupon}
            />
          </div>

          {/* Continue shopping */}
          <button
            type="button"
            onClick={handleContinueShopping}
            className="outlinebtn mt-4"
          >
            ← Continue shopping
          </button>
        </section>

        {/* Order summary */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="panel">
            <h2 className="mb-4 text-lg font-bold text-[var(--text)]">
              Order summary
            </h2>

            <CartSummary
              subtotal={activeSubtotal}
              discount={activeDiscount}
              shipping={activeShipping}
              tax={activeTax}
              total={activeTotal}
              coupon={coupon}
            />

            <button
              type="button"
              onClick={() => navigate("/checkout")}
              disabled={updating || applyingCoupon || !cartItems.length}
              className="primarybtn mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              Proceed to checkout →
            </button>

            <p className="muted mt-3 text-center text-xs leading-relaxed">
              Taxes and shipping are calculated according to your order details.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Cart;
