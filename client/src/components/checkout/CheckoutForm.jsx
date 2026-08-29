import { useState } from "react";

const CheckoutForm = ({
  initialData = {},
  onSubmit,
  onBack,
  loading = false,
}) => {
  const [form, setForm] = useState({
    email: initialData.email || "",
    phone: initialData.phone || "",
    notes: initialData.notes || "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === "phone" ? value.replace(/\D/g, "") : value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) {
      newErrors.phone = "Enter a valid 10-digit phone number.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit?.(form);
  };

  const inputClass = (field) =>
    `mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition dark:bg-gray-800 dark:text-white ${
      errors[field]
        ? "border-red-500 focus:ring-2 focus:ring-red-100"
        : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700"
    }`;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Contact & Delivery Details
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Confirm your contact information before placing the order.
        </p>
      </div>

      <div className="space-y-4">
        {/* Email */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Address
          </label>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            className={inputClass("email")}
          />

          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone Number
          </label>

          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            maxLength={10}
            inputMode="numeric"
            placeholder="10-digit mobile number"
            className={inputClass("phone")}
          />

          {errors.phone && (
            <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Delivery Instructions
          </label>

          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={4}
            maxLength={500}
            placeholder="Any special instructions for delivery? (optional)"
            className="mt-1.5 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />

          <div className="mt-1 flex justify-end">
            <span className="text-xs text-gray-400">
              {form.notes.length}/500
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-between gap-3">
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

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Processing..." : "Continue"}
        </button>
      </div>
    </form>
  );
};

export default CheckoutForm;
