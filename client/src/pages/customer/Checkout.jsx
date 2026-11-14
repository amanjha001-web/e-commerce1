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

          let addrList = [];
          if (Array.isArray(addrRes)) addrList = addrRes;
          else if (Array.isArray(addrRes?.data)) addrList = addrRes.data;
          else if (Array.isArray(addrRes?.data?.addresses)) addrList = addrRes.data.addresses;
          else if (Array.isArray(addrRes?.addresses)) addrList = addrRes.addresses;
          else if (Array.isArray(addrRes?.data?.data)) addrList = addrRes.data.data;
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
    const rawSubtotal = Number(cart?.subtotal ?? cart?.totalAmount) || 0;
    if (rawSubtotal > 0) {
      return rawSubtotal;
    }

    return items.reduce((total, item) => {
      const prod = item?.product || item;
      const price =
        Number(
          item?.price ??
            item?.unitPrice ??
            prod?.price ??
            prod?.sellingPrice ??
            prod?.salePrice ??
            0,
        ) || 0;

      const qty = Number(item?.quantity ?? item?.qty ?? 1);
      return total + price * qty;
    }, 0);
  }, [cart, items]);

  const couponCodeStr =
    typeof cart?.coupon === "string" ? cart.coupon : cart?.coupon?.code || "";
  let derivedDiscount = Number(
    cart?.discount || cart?.discountAmount || cart?.coupon?.discount || 0,
  );
  if (derivedDiscount <= 0 && couponCodeStr && subtotal > 0) {
    const codeMatch = String(couponCodeStr).match(/(\d+)/);
    if (codeMatch) {
      const rate = parseFloat(codeMatch[1]) || 0;
      derivedDiscount =
        rate <= 50 ? (subtotal * rate) / 100 : Math.min(rate, subtotal);
    }
  }
  const discount = Math.max(0, derivedDiscount);
  const shipping = Number(
    cart?.shippingCharge ?? cart?.shipping ?? 0,
  );
  const tax = Number(cart?.tax || 0);

  const effectiveShipping = subtotal >= 999 || items.length === 0 ? 0 : (shipping > 0 ? shipping : 50);
  const total = Math.max(0, subtotal - discount + effectiveShipping + tax);

  const handleAddressSelect = (address) => {
    if (onSelectAddress) {
      onSelectAddress(address);
    } else {
      setInternalSelectedAddress(address);
    }
  };

  const handleAddAddress = async (data) => {
    if (onAddAddress) {
      await onAddAddress(data);
    } else {
      try {
        const res = await addressService.addAddress(data);
        const newAddr = res?.data?.address || res?.data || data;
        const addrRes = await addressService.getAddresses();
        let aList = [];
        if (Array.isArray(addrRes)) aList = addrRes;
        else if (Array.isArray(addrRes?.data)) aList = addrRes.data;
        else if (Array.isArray(addrRes?.data?.addresses)) aList = addrRes.data.addresses;
        else if (Array.isArray(addrRes?.addresses)) aList = addrRes.addresses;
        setInternalAddresses(aList.length > 0 ? aList : [newAddr]);
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
        addressId,
        shippingAddressId: addressId,
        shippingAddress: {
          fullName: selectedAddress.fullName || selectedAddress.name || "",
          phone: selectedAddress.phone || "",
          street: selectedAddress.street || selectedAddress.addressLine1 || "",
          apartment: selectedAddress.apartment || selectedAddress.addressLine2 || "",
          city: selectedAddress.city || "",
          state: selectedAddress.state || "",
          postalCode: selectedAddress.postalCode || selectedAddress.zipCode || "",
          country: selectedAddress.country || "India",
        },
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
        // Online Payment Flow (UPI / Cards / Razorpay)
        try {
          const payRes = await paymentService.createPaymentOrder(orderId);
          const payData = payRes?.data || payRes;
          const rzpOrderId = payData?.razorpayOrderId || payData?.orderId || payData?.id;
          const rzpKey = payData?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_placeholder";

          const openRazorpay = () => {
            const options = {
              key: rzpKey,
              amount: payData.amount || Math.round(total * 100),
              currency: payData.currency || "INR",
              name: "ShopSphere",
              description: `Order #${orderId}`,
              order_id: rzpOrderId,
              handler: async (response) => {
                try {
                  await paymentService.verifyPayment({
                    orderId,
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
            rzp.on("payment.failed", (err) => {
              toast.error(err?.error?.description || "Payment failed");
            });
            rzp.open();
          };

          if (window.Razorpay) {
            openRazorpay();
          } else {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => openRazorpay();
            script.onerror = () => {
              toast.error("Could not load payment gateway. Redirecting to order details.");
              navigate(`/orders/${orderId}`);
            };
            document.body.appendChild(script);
          }
        } catch (payErr) {
          console.error("Payment initiation error:", payErr);
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
                  selectedAddressId={selectedAddress?._id || selectedAddress?.id}
                  onSelect={handleAddressSelect}
                  onAdd={() => setShowAddressForm(true)}
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
                shipping={effectiveShipping}
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
                {placingOrder
                  ? "Processing order..."
                  : selectedPaymentMethod?.toLowerCase() === "cod"
                  ? `Place COD order (₹${total.toLocaleString("en-IN", { maximumFractionDigits: 2 })})`
                  : `Pay ₹${total.toLocaleString("en-IN", { maximumFractionDigits: 2 })} via UPI / Razorpay →`}
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
