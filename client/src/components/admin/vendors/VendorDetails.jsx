import { useEffect, useState } from "react";

import Modal from "../../common/Modal";
import Badge from "../../common/Badge";
import Button from "../../common/Button";

/* -------------------- Helpers -------------------- */

const extractImageUrl = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.url || value.secure_url || "";
  }
  return "";
};

const createFormData = (vendor) => {
  const address = vendor?.address || {};
  const userObj = vendor?.user || (typeof vendor?.userId === "object" ? vendor.userId : null);

  return {
    shopName:
      vendor?.shopName || vendor?.storeName || vendor?.businessName || "",
    email: vendor?.email || userObj?.email || "",
    phone: vendor?.phone || userObj?.phone || "",
    website: vendor?.website || "",
    businessType:
      vendor?.businessType ||
      vendor?.storeType ||
      vendor?.businessDetails?.businessLicense ||
      "",
    gstNumber:
      vendor?.gstNumber ||
      vendor?.taxId ||
      vendor?.businessDetails?.taxNumber ||
      vendor?.gst ||
      "",
    commissionRate:
      vendor?.commissionRate !== undefined && vendor?.commissionRate !== null
        ? String(vendor.commissionRate)
        : "10",
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

const getStatusVariant = (status, isActive) => {
  if (!isActive && String(status || "").toLowerCase() === "approved") {
    return "danger";
  }
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
  onApprove,
  onReject,
  onDelete,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(() => initialEdit);
  const [formData, setFormData] = useState(() => createFormData(vendor));
  const [formError, setFormError] = useState("");
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState(
    vendor?.rejectionReason || "Application did not meet verification requirements.",
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setFormData(createFormData(vendor));
    }
  }, [vendor, isEditing]);

  const userObj =
    vendor?.user || (typeof vendor?.userId === "object" ? vendor.userId : null);

  const vendorName =
    vendor.shopName ||
    vendor.storeName ||
    vendor.businessName ||
    vendor.name ||
    "Vendor";

  const ownerName =
    vendor.ownerName ||
    userObj?.fullName ||
    userObj?.name ||
    "N/A";

  const vendorId = vendor._id || vendor.id || "N/A";
  const isActive = vendor.isActive !== false;
  const rawStatus =
    vendor.displayStatus ||
    vendor.status ||
    (vendor.isApproved
      ? "approved"
      : isActive
        ? "active"
        : "inactive");

  const image =
    extractImageUrl(vendor.logo) ||
    extractImageUrl(vendor.storeLogo) ||
    extractImageUrl(vendor.avatar) ||
    extractImageUrl(userObj?.avatar);

  const bankAccount =
    vendor.bankAccount || vendor.businessDetails?.bankAccount || {};
  const hasBankDetails = Boolean(
    bankAccount?.accountNumber ||
      bankAccount?.bankName ||
      bankAccount?.accountHolderName ||
      bankAccount?.ifscCode,
  );

  const recentProducts = Array.isArray(vendor.recentProducts)
    ? vendor.recentProducts
    : [];
  const recentOrders = Array.isArray(vendor.recentOrders)
    ? vendor.recentOrders
    : [];

  /* -------------------- Handlers -------------------- */

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

  const handleSave = async (event) => {
    event.preventDefault();
    if (saving) return;

    if (typeof onUpdate !== "function") {
      setFormError("Vendor update handler is not connected in Vendors.jsx.");
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

    const parsedCommission =
      formData.commissionRate === "" ? undefined : Number(formData.commissionRate);
    if (
      parsedCommission !== undefined &&
      (Number.isNaN(parsedCommission) || parsedCommission < 0 || parsedCommission > 100)
    ) {
      setFormError("Commission rate must be between 0 and 100.");
      return;
    }

    const vendorData = {
      storeName: formData.shopName.trim(),
      shopName: formData.shopName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      website: formData.website.trim(),
      businessType: formData.businessType.trim(),
      gstNumber: formData.gstNumber.trim(),
      ...(parsedCommission !== undefined ? { commissionRate: parsedCommission } : {}),
      description: formData.shopDescription.trim(),
      shopDescription: formData.shopDescription.trim(),
      address: {
        street: formData.address.street.trim(),
        city: formData.address.city.trim(),
        state: formData.address.state.trim(),
        postalCode: formData.address.pincode.trim(),
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
            disabled={saving}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
          />
        ) : (
          <input
            type={options.type || "text"}
            name={name}
            min={options.min}
            max={options.max}
            step={options.step}
            value={value}
            onChange={onChange}
            required={options.required}
            disabled={saving}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
          />
        )
      ) : (
        <p className="break-words text-sm font-medium text-foreground">
          {options.suffix && value !== "" && value !== undefined
            ? `${value}${options.suffix}`
            : getValue(value)}
        </p>
      )}
    </label>
  );

  return (
    <Modal
      isOpen={open}
      onClose={saving ? () => {} : onClose}
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

            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-foreground">
                {isEditing ? formData.shopName || vendorName : vendorName}
              </h3>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                ID: {vendorId}
                {vendor.slug ? ` · /${vendor.slug}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getStatusVariant(rawStatus, isActive)}>
              <span className="capitalize">
                {String(rawStatus).replaceAll("_", " ")}
              </span>
            </Badge>
            <Badge variant={isActive ? "success" : "danger"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        {loading && (
          <p className="text-xs font-medium text-muted-foreground">
            Refreshing latest vendor analytics & details...
          </p>
        )}

        {vendor.rejectionReason && (
          <div className="rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-4 py-3 text-xs text-[#bd3345]">
            <span className="font-bold">Rejection / Suspension Note:</span>{" "}
            {vendor.rejectionReason}
          </div>
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

            <ReadOnlyField label="Owner Name" value={ownerName} />

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
              value={formatDate(vendor.createdAt || vendor.createdDate)}
            />

            {renderField(
              "Business Type",
              "businessType",
              formData.businessType,
              handleFieldChange,
            )}

            {renderField(
              "GST / Tax Number",
              "gstNumber",
              formData.gstNumber,
              handleFieldChange,
            )}

            {renderField(
              "Commission Rate (%)",
              "commissionRate",
              formData.commissionRate,
              handleFieldChange,
              { type: "number", min: 0, max: 100, step: 0.5, suffix: "%" },
            )}

            <ReadOnlyField
              label="Account Email"
              value={userObj?.email || vendor.email}
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
              { multiline: true, rows: 3 },
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
              "Pincode / Postal Code",
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
            Performance & Earnings
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
                value: `${Number(vendor.rating ?? vendor.averageRating ?? 0).toFixed(1)} (${vendor.numReviews ?? 0})`,
              },
              {
                label: "Gross Revenue",
                value: `₹${Number(
                  vendor.revenue ?? vendor.totalRevenue ?? 0,
                ).toLocaleString("en-IN")}`,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border bg-white p-4"
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {(vendor.netEarnings > 0 || vendor.availableBalance > 0) && (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-white p-4">
                <p className="text-xs text-muted-foreground">Net Earnings</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  ₹{Number(vendor.netEarnings || 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-white p-4">
                <p className="text-xs text-muted-foreground">Available Balance</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  ₹{Number(vendor.availableBalance || 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Bank Details */}
        {hasBankDetails && (
          <section>
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              Payout / Bank Details
            </h4>
            <div className="grid gap-4 rounded-2xl border border-border p-5 sm:grid-cols-2">
              <ReadOnlyField
                label="Account Holder"
                value={bankAccount.accountHolderName}
              />
              <ReadOnlyField label="Bank Name" value={bankAccount.bankName} />
              <ReadOnlyField
                label="Account Number"
                value={bankAccount.accountNumber}
              />
              <ReadOnlyField label="IFSC Code" value={bankAccount.ifscCode} />
            </div>
          </section>
        )}

        {/* Recent Products / Orders */}
        {(recentProducts.length > 0 || recentOrders.length > 0) && (
          <section className="grid gap-4 sm:grid-cols-2">
            {recentProducts.length > 0 && (
              <div className="rounded-2xl border border-border p-4">
                <h5 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Recent Products
                </h5>
                <div className="space-y-2">
                  {recentProducts.map((p) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-1.5 text-xs last:border-b-0 last:pb-0"
                    >
                      <span className="truncate font-medium text-foreground">
                        {p.name}
                      </span>
                      <span className="shrink-0 font-semibold text-muted-foreground">
                        ₹{Number(p.price || 0).toLocaleString("en-IN")} · {p.stock ?? 0} left
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentOrders.length > 0 && (
              <div className="rounded-2xl border border-border p-4">
                <h5 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Recent Orders
                </h5>
                <div className="space-y-2">
                  {recentOrders.map((o) => (
                    <div
                      key={o._id}
                      className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-1.5 text-xs last:border-b-0 last:pb-0"
                    >
                      <span className="font-semibold text-foreground">
                        #{o.orderNumber}
                      </span>
                      <span className="capitalize text-muted-foreground">
                        {String(o.orderStatus || "").replace(/_/g, " ")} · ₹
                        {Number(o.totalAmount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Inline Reject Confirmation */}
        {rejectMode && !isEditing && (
          <div className="space-y-3 rounded-2xl border border-[#f3cbd0] bg-[#fff0f1] p-4">
            <label className="block text-xs font-bold text-[#bd3345]">
              Rejection Reason
            </label>
            <textarea
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-[#f3cbd0] bg-white px-3 py-2 text-sm text-foreground outline-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => setRejectMode(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                loading={saving}
                onClick={async () => {
                  await onReject?.(vendor, rejectReason.trim() || "Rejected by admin");
                  setRejectMode(false);
                }}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}

        {/* Inline Delete Confirmation */}
        {confirmDelete && !isEditing && (
          <div className="flex flex-col gap-3 rounded-2xl border border-[#f3cbd0] bg-[#fff0f1] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-[#bd3345]">
              Delete &ldquo;{vendorName}&rdquo; permanently? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => setConfirmDelete(false)}
              >
                Keep
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                loading={saving}
                onClick={() => onDelete?.(vendor)}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700"
          >
            {formError}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap flex-col-reverse gap-2.5 border-t border-border pt-5 sm:flex-row sm:justify-end">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={saving}
                disabled={typeof onUpdate !== "function"}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saving}
              >
                Close
              </Button>

              {onDelete && !confirmDelete && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    setRejectMode(false);
                    setConfirmDelete(true);
                  }}
                  disabled={saving}
                >
                  Delete
                </Button>
              )}

              {onApprove &&
                String(vendor.status || "").toLowerCase() !== "approved" && (
                  <Button
                    type="button"
                    variant="success"
                    onClick={() => onApprove(vendor)}
                    disabled={saving}
                  >
                    Approve Vendor
                  </Button>
                )}

              {onReject &&
                !rejectMode &&
                String(vendor.status || "").toLowerCase() !== "rejected" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setConfirmDelete(false);
                      setRejectMode(true);
                    }}
                    disabled={saving}
                  >
                    Reject
                  </Button>
                )}

              {onStatusChange && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onStatusChange(vendor)}
                  disabled={saving}
                >
                  Manage Status
                </Button>
              )}

              <Button
                type="button"
                onClick={() => {
                  setFormData(createFormData(vendor));
                  setFormError("");
                  setIsEditing(true);
                }}
                disabled={saving}
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
