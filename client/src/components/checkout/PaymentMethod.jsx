import { useState } from "react";

const PaymentMethod = ({
  value,
  onChange,
  onContinue,
  onBack,
  loading = false,
  methods = [
    {
      id: "razorpay",
      name: "Razorpay",
      description: "UPI, Cards, Net Banking & Wallets",
      icon: "💳",
    },
    {
      id: "cod",
      name: "Cash on Delivery",
      description: "Pay when your order arrives",
      icon: "💵",
    },
  ],
}) => {
  const [selectedMethod, setSelectedMethod] = useState(
    value || methods[0]?.id || "",
  );

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
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Payment Method
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose how you want to pay for your order.
        </p>
      </div>

      {/* Methods */}
      <div className="space-y-3">
        {methods.map((method) => {
          const isSelected = selectedMethod === method.id;

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => handleSelect(method.id)}
              disabled={loading || method.disabled}
              className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                isSelected
                  ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/10"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-800"
              } ${method.disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              {/* Icon */}
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl ${
                  isSelected
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                {method.icon}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {method.name}
                </p>

                {method.description && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {method.description}
                  </p>
                )}
              </div>

              {/* Radio */}
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  isSelected
                    ? "border-blue-600 bg-blue-600 dark:border-blue-500 dark:bg-blue-500"
                    : "border-gray-300 dark:border-gray-600"
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
      <div className="mt-5 flex items-start gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
        <span className="text-base">🔒</span>

        <div>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Secure Payment
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
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
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
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
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Processing..." : "Continue"}
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentMethod;
