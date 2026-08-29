import { useState } from "react";

const initialForm = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  addressType: "home",
};

const AddAddress = ({
  initialAddress = null,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form, setForm] = useState(
    initialAddress
      ? {
          fullName: initialAddress.fullName || "",
          phone: initialAddress.phone || "",
          addressLine1:
            initialAddress.addressLine1 || initialAddress.address || "",
          addressLine2: initialAddress.addressLine2 || "",
          city: initialAddress.city || "",
          state: initialAddress.state || "",
          pincode: initialAddress.pincode || initialAddress.postalCode || "",
          landmark: initialAddress.landmark || "",
          addressType: initialAddress.addressType || "home",
        }
      : initialForm,
  );

  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === "phone" || name === "pincode"
          ? value.replace(/\D/g, "")
          : value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      newErrors.phone = "Enter a valid 10-digit phone number.";
    }

    if (!form.addressLine1.trim()) {
      newErrors.addressLine1 = "Address is required.";
    }

    if (!form.city.trim()) {
      newErrors.city = "City is required.";
    }

    if (!form.state.trim()) {
      newErrors.state = "State is required.";
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      newErrors.pincode = "Enter a valid 6-digit PIN code.";
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
    `mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition ${
      errors[field]
        ? "border-red-500 focus:ring-2 focus:ring-red-100"
        : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:focus:border-blue-500"
    } bg-white text-gray-900 dark:bg-gray-800 dark:text-white`;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {initialAddress ? "Edit Address" : "Add New Address"}
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Enter your delivery details.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Full Name */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Full Name *
          </label>

          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Enter full name"
            className={inputClass("fullName")}
          />

          {errors.fullName && (
            <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone Number *
          </label>

          <input
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

        {/* Address */}
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Address Line 1 *
          </label>

          <input
            name="addressLine1"
            value={form.addressLine1}
            onChange={handleChange}
            placeholder="House no., building, street"
            className={inputClass("addressLine1")}
          />

          {errors.addressLine1 && (
            <p className="mt-1 text-xs text-red-500">{errors.addressLine1}</p>
          )}
        </div>

        {/* Address 2 */}
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Address Line 2
          </label>

          <input
            name="addressLine2"
            value={form.addressLine2}
            onChange={handleChange}
            placeholder="Apartment, area, colony (optional)"
            className={inputClass("addressLine2")}
          />
        </div>

        {/* City */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            City *
          </label>

          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="Enter city"
            className={inputClass("city")}
          />

          {errors.city && (
            <p className="mt-1 text-xs text-red-500">{errors.city}</p>
          )}
        </div>

        {/* State */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            State *
          </label>

          <input
            name="state"
            value={form.state}
            onChange={handleChange}
            placeholder="Enter state"
            className={inputClass("state")}
          />

          {errors.state && (
            <p className="mt-1 text-xs text-red-500">{errors.state}</p>
          )}
        </div>

        {/* Pincode */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            PIN Code *
          </label>

          <input
            name="pincode"
            value={form.pincode}
            onChange={handleChange}
            maxLength={6}
            inputMode="numeric"
            placeholder="6-digit PIN code"
            className={inputClass("pincode")}
          />

          {errors.pincode && (
            <p className="mt-1 text-xs text-red-500">{errors.pincode}</p>
          )}
        </div>

        {/* Landmark */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Landmark
          </label>

          <input
            name="landmark"
            value={form.landmark}
            onChange={handleChange}
            placeholder="Nearby landmark (optional)"
            className={inputClass("landmark")}
          />
        </div>

        {/* Address Type */}
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Address Type
          </label>

          <div className="mt-2 flex gap-3">
            {[
              ["home", "🏠 Home"],
              ["work", "💼 Work"],
              ["other", "📍 Other"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setForm((previous) => ({
                    ...previous,
                    addressType: value,
                  }))
                }
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  form.addressType === value
                    ? "border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : initialAddress
              ? "Update Address"
              : "Save Address"}
        </button>
      </div>
    </form>
  );
};

export default AddAddress;
