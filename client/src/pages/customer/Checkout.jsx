
import { useMemo, useState } from "react";

import CheckoutSteps from "../../components/checkout/CheckoutSteps";
import AddressSelector from "../../components/checkout/AddressSelector";
import AddAddress from "../../components/checkout/AddAddress";
import OrderSummary from "../../components/checkout/OrderSummary";
import PaymentMethod from "../../components/checkout/PaymentMethod";
import PaymentStatus from "../../components/checkout/PaymentStatus";

import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";

const Checkout = ({
  cart = null,
  addresses = [],
  selectedAddress = null,
  selectedPaymentMethod = null,
  loading = false,
  placingOrder = false,
  paymentLoading = false,
  paymentStatus = null,
  error = null,
  onSelectAddress,
  onAddAddress,
  onSelectPaymentMethod,
  onPlaceOrder,
  onNavigate,
}) => {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [step, setStep] = useState(1);

  const items = cart?.items || [];

  const subtotal = useMemo(() => {
    if (cart?.subtotal !== undefined) {
      return Number(cart.subtotal) || 0;
    }

    return items.reduce((total, item) => {
      const price =
        Number(
          item?.price ??
            item?.product?.salePrice ??
            item?.product?.price ??
            0
        ) || 0;

      return total + price * (Number(item?.quantity) || 0);
    }, 0);
  }, [cart, items]);

  const discount = Number(cart?.discount || 0);
  const shipping = Number(
    cart?.shippingCharge ?? cart?.shipping ?? 0
  );
  const tax = Number(cart?.tax || 0);

  const total = Number(
    cart?.totalAmount ??
      cart?.total ??
      subtotal - discount + shipping + tax
  );

  const handleAddressSelect = (address) => {
    onSelectAddress?.(address);
    setStep(2);
  };

  const handleAddAddress = async (data) => {
    await onAddAddress?.(data);
    setShowAddressForm(false);
  };

  const handlePaymentSelect = (method) => {
    onSelectPaymentMethod?.(method);
    setStep(3);
  };

  const handlePlaceOrder = () => {
    if (!selectedAddress || !selectedPaymentMethod) return;

    onPlaceOrder?.({
      address: selectedAddress,
      paymentMethod: selectedPaymentMethod,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (paymentStatus) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <PaymentStatus
          status={paymentStatus}
          onNavigate={onNavigate}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">
          Secure Checkout
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Checkout
        </h1>
      </div>

      {/* Steps */}
      <div className="mb-8">
        <CheckoutSteps currentStep={step} />
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Main */}
        <div className="space-y-6">
          {/* Address */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  1. Delivery Address
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Select where you want your order delivered.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddressForm((value) => !value)}
              >
                {showAddressForm ? "Cancel" : "+ Add New"}
              </Button>
            </div>

            {showAddressForm ? (
              <AddAddress
                loading={placingOrder}
                onSubmit={handleAddAddress}
                onCancel={() => setShowAddressForm(false)}
              />
            ) : addresses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No saved addresses available.
                </p>

                <Button
                  className="mt-4"
                  onClick={() => setShowAddressForm(true)}
                >
                  Add Address
                </Button>
              </div>
            ) : (
              <AddressSelector
                addresses={addresses}
                selectedAddress={selectedAddress}
                onSelect={handleAddressSelect}
              />
            )}
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                2. Payment Method
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Choose your preferred payment method.
              </p>
            </div>

            <PaymentMethod
              value={selectedPaymentMethod}
              onChange={handlePaymentSelect}
              loading={paymentLoading}
            />
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold">
              Order Summary
            </h2>

            <OrderSummary
              cart={cart}
              items={items}
              subtotal={subtotal}
              discount={discount}
              shipping={shipping}
              tax={tax}
              total={total}
            />

            <Button
              className="mt-6 w-full"
              onClick={handlePlaceOrder}
              disabled={
                placingOrder ||
                !selectedAddress ||
                !selectedPaymentMethod ||
                !items.length
              }
            >
              {placingOrder
                ? "Placing Order..."
                : `Place Order • ₹${total.toFixed(2)}`}
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              By placing your order, you agree to our terms and
              conditions.
            </p>
          </div>
        </aside>
      </div>

      {/* Back */}
      <button
        type="button"
        onClick={() => onNavigate?.("/cart")}
        className="mt-8 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        ← Back to Cart
      </button>
    </main>
  );
};

export default Checkout;