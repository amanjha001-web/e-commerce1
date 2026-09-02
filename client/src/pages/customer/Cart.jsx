import CartList from "../../components/cart/CartList";
import CartSummary from "../../components/cart/CartSummary";
import CartEmpty from "../../components/cart/CartEmpty";
import CartActions from "../../components/cart/CartActions";
import CouponBox from "../../components/cart/CouponBox";
import Loader from "../../components/common/Loader";

const Cart = ({
  cart = null,
  items = [],
  loading = false,
  updating = false,
  applyingCoupon = false,
  coupon = null,
  error = null,
  onUpdateQuantity,
  onRemoveItem,
  onApplyCoupon,
  onRemoveCoupon,
  onClearCart,
  onCheckout,
  onContinueShopping,
}) => {
  const cartItems = cart?.items || items || [];

  const subtotal =
    cart?.subtotal !== undefined
      ? Number(cart.subtotal) || 0
      : cartItems.reduce((total, item) => {
          const price =
            Number(
              item?.price ??
                item?.product?.salePrice ??
                item?.product?.price ??
                0,
            ) || 0;

          const quantity = Number(item?.quantity) || 0;

          return total + price * quantity;
        }, 0);

  const discount = Number(cart?.discount ?? coupon?.discount ?? 0) || 0;

  const shipping = Number(cart?.shippingCharge ?? cart?.shipping ?? 0) || 0;

  const tax = Number(cart?.tax ?? 0) || 0;

  const calculatedTotal = subtotal - discount + shipping + tax;

  const total =
    Number(cart?.totalAmount ?? cart?.total ?? calculatedTotal) || 0;

  const itemCount = cartItems.reduce(
    (count, item) => count + (Number(item?.quantity) || 0),
    0,
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!cartItems.length) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">Shopping Cart</p>

          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Your Cart</h1>
        </div>

        <CartEmpty onContinueShopping={onContinueShopping} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Shopping Cart</p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Your Cart
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        <CartActions
          onClearCart={onClearCart}
          onContinueShopping={onContinueShopping}
          loading={updating}
        />
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      {/* Cart Layout */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Items */}
        <section className="min-w-0">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <CartList
              items={cartItems}
              loading={updating}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
            />
          </div>

          {/* Coupon */}
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
              onApply={onApplyCoupon}
              onRemove={onRemoveCoupon}
            />
          </div>

          {/* Continue Shopping */}
          <button
            type="button"
            onClick={onContinueShopping}
            className="mt-6 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            ← Continue Shopping
          </button>
        </section>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold">Order Summary</h2>

            <CartSummary
              subtotal={subtotal}
              discount={discount}
              shipping={shipping}
              tax={tax}
              total={total}
              coupon={coupon}
            />

            <button
              type="button"
              onClick={onCheckout}
              disabled={updating || !cartItems.length}
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
