import { useState, useEffect } from "react";

const DEFAULT_METHODS = [
  {
    id: "razorpay",
    name: "Razorpay (UPI, Cards, Net Banking)",
    description: "Instant pay via UPI (GPay, PhonePe, Paytm, QR), Debit/Credit Cards & Net Banking",
    icon: "💳",
  },
  {
    id: "cod",
    name: "Cash on Delivery (COD)",
    description: "Pay with cash or UPI upon delivery at your doorstep",
    icon: "💵",
  },
];

const PaymentMethod = ({
  value,
  onChange,
  onContinue,
  onBack,
  loading = false,
  methods = DEFAULT_METHODS,
}) => {
  const [selectedMethod, setSelectedMethod] = useState(
    (value || methods[0]?.id || "razorpay").toLowerCase(),
  );

  useEffect(() => {
    if (value) {
      setSelectedMethod(String(value).toLowerCase());
    }
  }, [value]);

  const handleSelect = (methodId) => {
    setSelectedMethod(methodId);
    onChange?.(methodId);
  };

  const handleContinue = () => {
    if (!selectedMethod) {
      return;
    }

    onContinue?.(selectedMethod);
  };

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5 dark:border-gray-800 dark:bg-card">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-base font-bold text-[var(--text)] dark:text-white">
          Payment Method
        </h2>

        <p className="mt-1 text-xs text-[var(--muted)]">
          Choose how you want to pay for your order.
        </p>
      </div>

      {/* Methods */}
      <div className="space-y-3">
        {methods.map((method) => {
          const isSelected = selectedMethod === method.id.toLowerCase();

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => handleSelect(method.id.toLowerCase())}
              disabled={loading || method.disabled}
              className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition cursor-pointer ${
                isSelected
                  ? "border-[var(--primary)] bg-[var(--soft)]/40 ring-1 ring-[var(--primary)]/30 dark:bg-card"
                  : "border-[var(--line)] bg-white hover:border-[var(--primary)]/40 hover:bg-gray-50/50 dark:border-gray-800 dark:bg-card dark:hover:bg-gray-800/40"
              } ${method.disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              {/* Icon */}
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                  isSelected
                    ? "bg-[var(--soft)] text-[var(--primary)]"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                {method.icon}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[var(--text)] dark:text-white">
                  {method.name}
                </p>

                {method.description && (
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {method.description}
                  </p>
                )}
              </div>

              {/* Radio */}
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary)]"
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                }`}
              >
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-white" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Security */}
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-[var(--line)]/60 bg-[var(--soft)]/30 p-3.5 dark:bg-gray-800/60">
        <span className="text-base">🔒</span>

        <div>
          <p className="text-xs font-bold text-[var(--text)] dark:text-gray-300">
            Secure Payment
          </p>

          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Your payment information is protected and securely processed.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="btnsm"
          >
            Back
          </button>
        ) : (
          <span />
        )}

        {onContinue && (
          <button
            type="button"
            onClick={handleContinue}
            disabled={loading || !selectedMethod}
            className="primarybtn !py-2 !px-5 !text-xs !rounded-xl"
          >
            {loading ? "Processing..." : "Continue"}
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentMethod;
