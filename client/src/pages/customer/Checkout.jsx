import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import cartService from "../../services/cart.service";
import addressService from "../../services/address.service";
import orderService from "../../services/order.service";
import paymentService from "../../services/payment.service";

import CheckoutSteps from "../../components/checkout/CheckoutSteps";
import AddressSelector from "../../components/checkout/AddressSelector";
import AddAddress from "../../components/checkout/AddAddress";
import OrderSummary from "../../components/checkout/OrderSummary";
import PaymentMethod from "../../components/checkout/PaymentMethod";
import PaymentStatus from "../../components/checkout/PaymentStatus";

import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";

const Checkout = ({
  cart: propCart = null,
  addresses: propAddresses = [],
  selectedAddress: propSelectedAddress = null,
  selectedPaymentMethod: propSelectedPaymentMethod = null,
  loading: propLoading = false,
  placingOrder: propPlacingOrder = false,
  paymentLoading: propPaymentLoading = false,
  paymentStatus: propPaymentStatus = null,
  error: propError = null,
  onSelectAddress,
  onAddAddress,
  onSelectPaymentMethod,
  onPlaceOrder,
  onNavigate,
}) => {
  const navigate = useNavigate();

  const [internalCart, setInternalCart] = useState(null);
  const [internalAddresses, setInternalAddresses] = useState([]);
  const [internalSelectedAddress, setInternalSelectedAddress] = useState(null);
  const [internalPaymentMethod, setInternalPaymentMethod] = useState("cod");
  const [internalLoading, setInternalLoading] = useState(!propCart);
  const [internalPlacingOrder, setInternalPlacingOrder] = useState(false);
  const [internalPaymentStatus, setInternalPaymentStatus] = useState(null);
  const [internalError, setInternalError] = useState("");

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [step, setStep] = useState(1);

  const cart = propCart || internalCart;
  const addresses = propAddresses?.length > 0 ? propAddresses : internalAddresses;
  const selectedAddress = propSelectedAddress || internalSelectedAddress;
  const selectedPaymentMethod = propSelectedPaymentMethod || internalPaymentMethod;
  const loading = propCart ? propLoading : internalLoading;
  const placingOrder = propPlacingOrder || internalPlacingOrder;
  const paymentLoading = propPaymentLoading || false;
  const paymentStatus = propPaymentStatus || internalPaymentStatus;
  const error = propError || internalError;

  // Fetch Cart and Addresses if not passed via props
  useEffect(() => {
    if (!propCart) {
      setInternalLoading(true);
      Promise.all([cartService.getCart(), addressService.getAddresses()])
        .then(([cartRes, addrRes]) => {
          const cData = cartRes?.data?.cart || cartRes?.data || cartRes;
          setInternalCart(cData);

          const aData = addrRes?.data?.addresses || addrRes?.data || addrRes || [];
          const addrList = Array.isArray(aData) ? aData : [];
          setInternalAddresses(addrList);

          if (addrList.length > 0) {
            const def = addrList.find((a) => a.isDefault || a.default) || addrList[0];
            setInternalSelectedAddress(def);
          }
        })
        .catch((err) => {
          console.error("Checkout data fetch error:", err);
          setInternalError("Failed to load checkout details. Please refresh.");
        })
        .finally(() => {
          setInternalLoading(false);
        });
    }
  }, [propCart]);

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
            0,
        ) || 0;

      return total + price * (Number(item?.quantity) || 0);
    }, 0);
  }, [cart, items]);

  const discount = Number(cart?.discount || 0);
  const shipping = Number(
    cart?.shippingCharge ?? cart?.shipping ?? 0,
  );
  const tax = Number(cart?.tax || 0);

  const total = Number(
    cart?.totalAmount ??
      cart?.total ??
      subtotal - discount + shipping + tax,
  );

  const handleAddressSelect = (address) => {
    if (onSelectAddress) {
      onSelectAddress(address);
    } else {
      setInternalSelectedAddress(address);
    }
    setStep(2);
  };

  const handleAddAddress = async (data) => {
    if (onAddAddress) {
      await onAddAddress(data);
    } else {
      try {
        const res = await addressService.addAddress(data);
        const newAddr = res?.data?.address || res?.data || data;
        const addrRes = await addressService.getAddresses();
        const aData = addrRes?.data?.addresses || addrRes?.data || [];
        setInternalAddresses(Array.isArray(aData) ? aData : [newAddr]);
        setInternalSelectedAddress(newAddr);
        toast.success("Delivery address added");
      } catch (err) {
        toast.error("Failed to add address");
      }
    }
    setShowAddressForm(false);
  };

  const handlePaymentSelect = (method) => {
    if (onSelectPaymentMethod) {
      onSelectPaymentMethod(method);
    } else {
      setInternalPaymentMethod(method);
    }
    setStep(3);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress || !selectedPaymentMethod) {
      toast.error("Please select a delivery address and payment method");
      return;
    }

    if (onPlaceOrder) {
      return onPlaceOrder({
        address: selectedAddress,
        paymentMethod: selectedPaymentMethod,
      });
    }

    try {
      setInternalPlacingOrder(true);
      setInternalError("");

      const addressId = selectedAddress._id || selectedAddress.id;
      const orderPayload = {
        shippingAddressId: addressId,
        paymentMethod: selectedPaymentMethod.toLowerCase(),
        customerNote: "Placed via ShopSphere Checkout",
      };

      const res = await orderService.createOrder(orderPayload);
      const createdOrder = res?.data?.order || res?.data || res;
      const orderId = createdOrder?._id || createdOrder?.id;

      if (!orderId) {
        throw new Error("Order creation failed - no order ID returned");
      }

      toast.success("Order placed successfully!");

      if (selectedPaymentMethod.toLowerCase() === "cod") {
        navigate(`/orders/${orderId}`);
      } else {
        // Online Payment Flow (Razorpay)
        try {
          const payRes = await paymentService.createPaymentOrder(orderId);
          const payData = payRes?.data || payRes;

          if (window.Razorpay && payData?.keyId && payData?.orderId) {
            const options = {
              key: payData.keyId,
              amount: payData.amount,
              currency: payData.currency || "INR",
              name: "ShopSphere",
              description: `Order #${orderId}`,
              order_id: payData.orderId,
              handler: async (response) => {
                try {
                  await paymentService.verifyPayment({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  });
                  toast.success("Payment verified successfully!");
                  navigate(`/orders/${orderId}`);
                } catch {
                  toast.error("Payment verification failed");
                  navigate(`/orders/${orderId}`);
                }
              },
              prefill: {
                name: selectedAddress.fullName || selectedAddress.name || "",
                contact: selectedAddress.phone || "",
              },
              theme: { color: "#881337" },
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
          } else {
            // Test or fallback
            navigate(`/orders/${orderId}`);
          }
        } catch {
          navigate(`/orders/${orderId}`);
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to place order";
      setInternalError(msg);
      toast.error(msg);
    } finally {
      setInternalPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <Loader />
      </div>
    );
  }

  if (paymentStatus) {
    return (
      <main className="page">
        <div className="mx-auto max-w-4xl">
          <PaymentStatus
            status={paymentStatus}
            onContinueShopping={() => onNavigate?.("/products")}
            onViewOrders={() => onNavigate?.("/orders")}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div>
        {/* Header */}
        <div className="mb-6">
          <div className="eyebrow">Almost yours</div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--text)]">
            Checkout
          </h1>
        </div>

        {/* Steps */}
        <div className="mb-6">
          <CheckoutSteps currentStep={step} />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-2xl border border-[#f3cbd0] bg-[#fff0f1] px-4 py-3 text-xs font-bold text-[var(--red)]">
            {error}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Main Content */}
          <div className="space-y-5">
            {/* 1. Address Section */}
            <section className="panel">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text)] dark:text-foreground">
                    1. Delivery address
                  </h2>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    Select where you want your order delivered.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddressForm((val) => !val)}
                  className="btnsm"
                >
                  {showAddressForm ? "Cancel" : "+ Add address"}
                </button>
              </div>

              {showAddressForm ? (
                <AddAddress
                  loading={placingOrder}
                  onSubmit={handleAddAddress}
                  onCancel={() => setShowAddressForm(false)}
                />
              ) : addresses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--soft)] p-8 text-center">
                  <p className="text-xs text-[var(--muted)]">
                    No saved addresses found.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    className="primarybtn mt-3 !py-2 !px-4 !text-xs"
                  >
                    + Add delivery address
                  </button>
                </div>
              ) : (
                <AddressSelector
                  addresses={addresses}
                  selectedAddress={selectedAddress}
                  onSelect={handleAddressSelect}
                />
              )}
            </section>

            {/* 2. Payment Method */}
            <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xs dark:bg-card dark:border-line">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-[var(--text)] dark:text-foreground">
                  2. Payment method
                </h2>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  Choose cash on delivery, UPI, or cards.
                </p>
              </div>

              <PaymentMethod
                value={selectedPaymentMethod}
                onChange={handlePaymentSelect}
                loading={paymentLoading}
              />
            </section>
          </div>

          {/* Order Total Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xs dark:bg-card dark:border-line">
              <h2 className="mb-5 text-lg font-bold text-[var(--text)] dark:text-foreground">
                Order summary
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

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={
                  placingOrder ||
                  !selectedAddress ||
                  !selectedPaymentMethod ||
                  !items.length
                }
                className="primarybtn mt-6 w-full !py-3 !text-sm !rounded-xl"
              >
                {placingOrder ? "Placing order..." : "Place order →"}
              </button>

              <p className="mt-3 text-center text-[11px] text-[var(--muted)] leading-relaxed">
                ✓ Secure checkout · 100% money-back guarantee
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Checkout;
