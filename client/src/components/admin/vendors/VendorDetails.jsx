
import { useState } from "react";

import Modal from "../../common/Modal";
import Badge from "../../common/Badge";
import Button from "../../common/Button";

/* -------------------- Form Data -------------------- */

const createFormData = (vendor) => {
  const address = vendor?.address || {};

  return {
    shopName:
      vendor?.shopName || vendor?.storeName || vendor?.businessName || "",
    email: vendor?.email || vendor?.user?.email || "",
    phone: vendor?.phone || vendor?.user?.phone || "",
    website: vendor?.website || "",
    shopDescription:
      vendor?.shopDescription ||
      vendor?.description ||
      vendor?.storeDescription ||
      "",
    address: {
      street: address.street || address.addressLine1 || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || address.postalCode || "",
      country: address.country || "",
    },
  };
};

/* -------------------- Helpers -------------------- */

const getValue = (value, fallback = "N/A") => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return value;
};

const formatDate = (date) => {
  if (!date) return "N/A";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "N/A";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusVariant = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "active":
    case "approved":
      return "success";

    case "pending":
    case "under_review":
      return "warning";

    case "suspended":
    case "blocked":
    case "rejected":
    case "inactive":
      return "danger";

    default:
      return "default";
  }
};

/* -------------------- Read Only Field -------------------- */

const ReadOnlyField = ({ label, value }) => (
  <div>
    <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
      {label}
    </span>

    <p className="break-words text-sm font-medium text-foreground">
      {getValue(value)}
    </p>
  </div>
);

/* -------------------- Vendor Details Content -------------------- */

const VendorDetailsContent = ({
  vendor,
  open,
  loading = false,
  saving = false,
  initialEdit = false,
  onClose,
  onStatusChange,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(() => initialEdit);
  const [formData, setFormData] = useState(() => createFormData(vendor));
  const [formError, setFormError] = useState("");

  const isBusy = loading || saving;

  const vendorName =
    vendor.shopName ||
    vendor.storeName ||
    vendor.businessName ||
    vendor.name ||
    "Vendor";

  const ownerName =
    vendor.ownerName ||
    vendor.user?.fullName ||
    vendor.user?.name ||
    "N/A";

  const vendorId = vendor._id || vendor.id || "N/A";

  const status =
    vendor.status ||
    (vendor.isApproved
      ? "Approved"
      : vendor.isActive
        ? "Active"
        : "Inactive");

  const logo = vendor.logo?.url || vendor.logo;

  const image =
    (typeof logo === "string" ? logo : "") ||
    vendor.storeLogo?.url ||
    vendor.storeLogo ||
    vendor.avatar ||
    vendor.user?.avatar ||
    "";

  /* -------------------- Input Handlers -------------------- */

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleAddressChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      address: {
        ...previous.address,
        [name]: value,
      },
    }));
  };

  const handleCancelEdit = () => {
    setFormData(createFormData(vendor));
    setFormError("");
    setIsEditing(false);
  };

  /* -------------------- Save Vendor -------------------- */

  const handleSave = async (event) => {
    event.preventDefault();

    if (isBusy) return;

    if (typeof onUpdate !== "function") {
      setFormError(
        "Vendor update handler is not connected in Vendors.jsx.",
      );
      return;
    }

    const actualVendorId = vendor._id || vendor.id;

    if (!actualVendorId) {
      setFormError("Vendor ID is missing.");
      return;
    }

    if (!formData.shopName.trim()) {
      setFormError("Shop name is required.");
      return;
    }

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      setFormError("Please enter a valid email address.");
      return;
    }

    const vendorData = {
      shopName: formData.shopName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      website: formData.website.trim(),
      shopDescription: formData.shopDescription.trim(),
      address: {
        street: formData.address.street.trim(),
        city: formData.address.city.trim(),
        state: formData.address.state.trim(),
        pincode: formData.address.pincode.trim(),
        country: formData.address.country.trim(),
      },
    };

    setFormError("");

    try {
      const result = await onUpdate(actualVendorId, vendorData);

      if (result === true) {
        setIsEditing(false);
      } else {
        setFormError(
          typeof result === "string"
            ? result
            : "Vendor update failed. Please check the API response.",
        );
      }
    } catch (error) {
      setFormError(
        error?.message || "Failed to update vendor. Please try again.",
      );
    }
  };

  /* -------------------- Editable Field -------------------- */

  const renderField = (
    label,
    name,
    value,
    onChange,
    options = {},
  ) => (
    <label className="block" key={name}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </span>

      {isEditing ? (
        options.multiline ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            rows={options.rows || 3}
            required={options.required}
            disabled={isBusy}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
          />
        ) : (
          <input
            type={options.type || "text"}
            name={name}
            value={value}
            onChange={onChange}
            required={options.required}
            disabled={isBusy}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
          />
        )
      ) : (
        <p className="break-words text-sm font-medium text-foreground">
          {getValue(value)}
        </p>
      )}
    </label>
  );

  /* -------------------- Modal -------------------- */

  return (
    <Modal
      isOpen={open}
      onClose={isBusy ? () => {} : onClose}
      title={isEditing ? "Edit Vendor" : "Vendor Details"}
      size="lg"
    >
      <form onSubmit={handleSave} className="space-y-6">
        {/* Vendor Header */}

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {image ? (
              <img
                src={image}
                alt={vendorName}
                className="h-16 w-16 rounded-2xl border border-border object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-xl font-semibold text-primary">
                {vendorName.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {isEditing
                  ? formData.shopName || vendorName
                  : vendorName}
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Vendor ID: {vendorId}
              </p>
            </div>
          </div>

          <Badge variant={getStatusVariant(status)}>
            {String(status).replaceAll("_", " ")}
          </Badge>
        </div>

        {loading && (
          <p className="text-sm text-muted-foreground">
            Loading vendor details...
          </p>
        )}

        {/* Vendor Information */}

        <section>
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Vendor Information
          </h4>

          <div className="grid gap-4 rounded-2xl border border-border p-5 sm:grid-cols-2">
            {renderField(
              "Shop Name",
              "shopName",
              formData.shopName,
              handleFieldChange,
              { required: true },
            )}

            <ReadOnlyField
              label="Owner Name"
              value={ownerName}
            />

            {renderField(
              "Email",
              "email",
              formData.email,
              handleFieldChange,
              { type: "email" },
            )}

            {renderField(
              "Phone",
              "phone",
              formData.phone,
              handleFieldChange,
              { type: "tel" },
            )}

            {renderField(
              "Website",
              "website",
              formData.website,
              handleFieldChange,
            )}

            <ReadOnlyField
              label="Joined On"
              value={formatDate(
                vendor.createdAt || vendor.createdDate,
              )}
            />

            <ReadOnlyField
              label="Business Type"
              value={vendor.businessType || vendor.storeType}
            />

            <ReadOnlyField
              label="GST Number"
              value={vendor.gstNumber || vendor.gst}
            />
          </div>
        </section>

        {/* Store Information */}

        <section>
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Store Information
          </h4>

          <div className="rounded-2xl border border-border p-5">
            {renderField(
              "Description",
              "shopDescription",
              formData.shopDescription,
              handleFieldChange,
              { multiline: true, rows: 4 },
            )}
          </div>
        </section>

        {/* Address */}

        <section>
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Address
          </h4>

          <div className="grid gap-4 rounded-2xl border border-border p-5 sm:grid-cols-2">
            {renderField(
              "Street",
              "street",
              formData.address.street,
              handleAddressChange,
            )}

            {renderField(
              "City",
              "city",
              formData.address.city,
              handleAddressChange,
            )}

            {renderField(
              "State",
              "state",
              formData.address.state,
              handleAddressChange,
            )}

            {renderField(
              "Pincode",
              "pincode",
              formData.address.pincode,
              handleAddressChange,
            )}

            {renderField(
              "Country",
              "country",
              formData.address.country,
              handleAddressChange,
            )}
          </div>
        </section>

        {/* Statistics */}

        <section>
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Statistics
          </h4>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                label: "Products",
                value: vendor.productCount ?? vendor.productsCount ?? 0,
              },
              {
                label: "Orders",
                value: vendor.orderCount ?? vendor.ordersCount ?? 0,
              },
              {
                label: "Rating",
                value: vendor.rating ?? vendor.averageRating ?? "0",
              },
              {
                label: "Revenue",
                value: `₹${Number(
                  vendor.revenue ?? vendor.totalRevenue ?? 0,
                ).toLocaleString("en-IN")}`,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border bg-background p-4"
              >
                <p className="text-xs text-muted-foreground">
                  {item.label}
                </p>

                <p className="mt-1 text-lg font-semibold text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Error Message */}

        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {formError}
          </p>
        )}

        {/* Actions */}

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isBusy}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isBusy || typeof onUpdate !== "function"}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isBusy}
              >
                Close
              </Button>

              {onStatusChange && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onStatusChange(vendor)}
                  disabled={isBusy}
                >
                  Change Status
                </Button>
              )}

              <Button
                type="button"
                onClick={() => {
                  setFormData(createFormData(vendor));
                  setFormError("");
                  setIsEditing(true);
                }}
                disabled={isBusy}
              >
                Edit Vendor
              </Button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
};

/* -------------------- Wrapper -------------------- */

const VendorDetails = (props) => {
  const { vendor = null } = props;

  if (!vendor) return null;

  return (
    <VendorDetailsContent
      key={vendor._id || vendor.id}
      {...props}
      vendor={vendor}
    />
  );
};

export default VendorDetails;
