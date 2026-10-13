import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import vendorRequestService from "../../services/vendorRequest.service";

const initialForm = {
  shopName: "",
  businessName: "",
  description: "",
  email: "",
  phone: "",
  website: "",
  address: {
    country: "India",
    state: "",
    city: "",
    postalCode: "",
    addressLine1: "",
    addressLine2: "",
  },
  bankDetails: {
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
    upiId: "",
  },
};

const businessFields = [
  { name: "shopName", label: "Shop Name", placeholder: "Enter your shop name" },
  {
    name: "businessName",
    label: "Business Name",
    placeholder: "Enter registered business name",
  },
  {
    name: "email",
    label: "Business Email",
    type: "email",
    placeholder: "business@example.com",
  },
  {
    name: "phone",
    label: "Phone Number",
    type: "tel",
    placeholder: "10-digit mobile number",
  },
  {
    name: "website",
    label: "Website (Optional)",
    placeholder: "https://example.com",
    required: false,
  },
];

const addressFields = [
  { name: "country", label: "Country", placeholder: "India" },
  { name: "state", label: "State", placeholder: "Enter state" },
  { name: "city", label: "City", placeholder: "Enter city" },
  {
    name: "postalCode",
    label: "Postal Code",
    placeholder: "Enter postal code",
  },
  {
    name: "addressLine1",
    label: "Address Line 1",
    placeholder: "House number, street, area",
  },
  {
    name: "addressLine2",
    label: "Address Line 2 (Optional)",
    placeholder: "Landmark (optional)",
    required: false,
  },
];

const bankFields = [
  {
    name: "accountHolderName",
    label: "Account Holder Name",
    placeholder: "Name on bank account",
  },
  {
    name: "accountNumber",
    label: "Account Number",
    placeholder: "Enter account number",
  },
  { name: "ifscCode", label: "IFSC Code", placeholder: "e.g. SBIN0001234" },
  { name: "bankName", label: "Bank Name", placeholder: "Enter bank name" },
  {
    name: "branchName",
    label: "Branch Name",
    placeholder: "Enter branch name",
  },
  {
    name: "upiId",
    label: "UPI ID (Optional)",
    placeholder: "name@bank",
    required: false,
  },
];

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-700 bg-[#070b14] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const errorClass = "mt-1.5 text-xs text-red-400";

function FormField({
  name,
  label,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  required = true,
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-slate-300">
        {label}
        {required ? " *" : ""}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className={inputClass}
      />

      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}

export default function BecomeSeller() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleChange = (event, section = null) => {
    const { name, value } = event.target;
    const fieldName = section ? `${section}.${name}` : name;

    if (section) {
      setForm((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value,
        },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    setErrors((prev) => ({
      ...prev,
      [fieldName]: "",
    }));

    setApiError("");
  };

  const validateForm = () => {
    const nextErrors = {};

    const requiredFields = [
      ["shopName", form.shopName, "Shop name is required."],
      ["businessName", form.businessName, "Business name is required."],
      ["description", form.description, "Business description is required."],
      ["email", form.email, "Email is required."],
      ["phone", form.phone, "Phone number is required."],
      ["address.country", form.address.country, "Country is required."],
      ["address.state", form.address.state, "State is required."],
      ["address.city", form.address.city, "City is required."],
      [
        "address.postalCode",
        form.address.postalCode,
        "Postal code is required.",
      ],
      [
        "address.addressLine1",
        form.address.addressLine1,
        "Address is required.",
      ],
      [
        "bankDetails.accountHolderName",
        form.bankDetails.accountHolderName,
        "Account holder name is required.",
      ],
      [
        "bankDetails.accountNumber",
        form.bankDetails.accountNumber,
        "Account number is required.",
      ],
      [
        "bankDetails.ifscCode",
        form.bankDetails.ifscCode,
        "IFSC code is required.",
      ],
      [
        "bankDetails.bankName",
        form.bankDetails.bankName,
        "Bank name is required.",
      ],
      [
        "bankDetails.branchName",
        form.bankDetails.branchName,
        "Branch name is required.",
      ],
    ];

    requiredFields.forEach(([name, value, message]) => {
      if (!String(value).trim()) {
        nextErrors[name] = message;
      }
    });

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (form.phone.trim() && !/^\d{10}$/.test(form.phone.trim())) {
      nextErrors.phone = "Enter a valid 10-digit phone number.";
    }

    if (
      form.address.postalCode.trim() &&
      !/^[a-zA-Z0-9 -]{4,10}$/.test(form.address.postalCode.trim())
    ) {
      nextErrors["address.postalCode"] = "Enter a valid postal code.";
    }

    if (
      form.website.trim() &&
      !/^https?:\/\/.+\..+/i.test(form.website.trim())
    ) {
      nextErrors.website =
        "Enter a valid website URL starting with http:// or https://.";
    }

    if (
      form.bankDetails.accountNumber.trim() &&
      !/^\d{9,18}$/.test(form.bankDetails.accountNumber.trim())
    ) {
      nextErrors["bankDetails.accountNumber"] =
        "Account number must contain 9 to 18 digits.";
    }

    if (
      form.bankDetails.ifscCode.trim() &&
      !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
        form.bankDetails.ifscCode.trim().toUpperCase(),
      )
    ) {
      nextErrors["bankDetails.ifscCode"] = "Enter a valid IFSC code.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload = {
      shopName: form.shopName.trim(),
      businessName: form.businessName.trim(),
      description: form.description.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      website: form.website.trim(),
      address: {
        country: form.address.country.trim(),
        state: form.address.state.trim(),
        city: form.address.city.trim(),
        postalCode: form.address.postalCode.trim(),
        addressLine1: form.address.addressLine1.trim(),
        addressLine2: form.address.addressLine2.trim(),
      },
      bankDetails: {
        accountHolderName: form.bankDetails.accountHolderName.trim(),
        accountNumber: form.bankDetails.accountNumber.trim(),
        ifscCode: form.bankDetails.ifscCode.trim().toUpperCase(),
        bankName: form.bankDetails.bankName.trim(),
        branchName: form.bankDetails.branchName.trim(),
        upiId: form.bankDetails.upiId.trim(),
      },
    };

    try {
      setSubmitting(true);
      setApiError("");

      // Actual backend API call
      const response = await vendorRequestService.createRequest(payload);

      if (response?.success === false) {
        throw new Error(response.message || "Request submission failed.");
      }

      // POST response contains the created application in response.data
      navigate("/seller/request-status", {
        replace: true,
        state: { application: response?.data },
      });
    } catch (error) {
      setApiError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to submit your request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070b14] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 text-sm text-slate-400">
          <Link to="/" className="hover:text-blue-400">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white">Become a Seller</span>
        </div>

        <header className="mb-8">
          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
            Seller Registration
          </span>

          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
            Become a ShopSphere Seller
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Submit your business and bank details for admin review. You can
            check your application status after submission.
          </p>
        </header>

        <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm leading-6 text-blue-200">
          Your application will remain pending until an administrator reviews
          it. Submit accurate information. Your bank details are sensitive; only
          enter them on your trusted application.
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-800 bg-[#0e1422] p-5 sm:p-8"
        >
          <section>
            <h2 className="mb-5 border-b border-slate-800 pb-4 text-lg font-semibold">
              Business Information
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {businessFields.map((field) => (
                <FormField
                  key={field.name}
                  {...field}
                  value={form[field.name]}
                  onChange={handleChange}
                  error={errors[field.name]}
                  required={field.required !== false}
                />
              ))}

              <div className="sm:col-span-2">
                <label
                  htmlFor="description"
                  className="text-sm font-medium text-slate-300"
                >
                  Business Description *
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  required
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the products or services you plan to sell"
                  className={inputClass}
                />

                {errors.description && (
                  <p className={errorClass}>{errors.description}</p>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-5 border-b border-slate-800 pb-4 text-lg font-semibold">
              Business Address
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {addressFields.map((field) => (
                <FormField
                  key={field.name}
                  {...field}
                  name={field.name}
                  value={form.address[field.name]}
                  onChange={(event) => handleChange(event, "address")}
                  error={errors[`address.${field.name}`]}
                  required={field.required !== false}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Bank Details</h2>

            <p className="mb-5 text-sm leading-6 text-slate-400">
              Provide the bank details requested by the seller registration API.
            </p>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {bankFields.map((field) => (
                <FormField
                  key={field.name}
                  {...field}
                  value={form.bankDetails[field.name]}
                  onChange={(event) => handleChange(event, "bankDetails")}
                  error={errors[`bankDetails.${field.name}`]}
                  required={field.required !== false}
                />
              ))}
            </div>
          </section>

          {apiError && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-300"
            >
              {apiError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-4 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/seller/request-status"
              className="text-center text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Check Existing Request Status
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting Request..." : "Submit Seller Request →"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
