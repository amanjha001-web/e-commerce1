

import Modal from "../../common/Modal";
import Badge from "../../common/Badge";
import Button from "../../common/Button";

const VendorDetails = ({
  vendor = null,
  open = false,
  loading = false,
  onClose,
  onEdit,
  onStatusChange,
}) => {
  if (!vendor) {
    return null;
  }

  const getValue = (value, fallback = "N/A") => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return fallback;
    }

    return value;
  };

  const getStatusVariant = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "active":
      case "approved":
        return "success";

      case "pending":
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

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const vendorName =
    vendor.storeName ||
    vendor.businessName ||
    vendor.name ||
    vendor.fullName ||
    "Vendor";

  const ownerName =
    vendor.ownerName ||
    vendor.user?.fullName ||
    vendor.user?.name ||
    vendor.fullName ||
    "N/A";

  const email =
    vendor.email ||
    vendor.user?.email ||
    "N/A";

  const phone =
    vendor.phone ||
    vendor.mobile ||
    vendor.user?.phone ||
    "N/A";

  const status =
    vendor.status ||
    (vendor.isActive ? "Active" : "Inactive");

  const vendorId =
    vendor._id ||
    vendor.id ||
    "N/A";

  const image =
    vendor.logo ||
    vendor.storeLogo ||
    vendor.avatar ||
    vendor.user?.avatar ||
    "";

  const address = vendor.address || {};

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Vendor Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header */}
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
                {vendorName
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {vendorName}
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Vendor ID: {vendorId}
              </p>
            </div>
          </div>

          <Badge variant={getStatusVariant(status)}>
            {String(status).charAt(0).toUpperCase() +
              String(status).slice(1)}
          </Badge>
        </div>

        {/* Vendor Information */}
        <section>
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Vendor Information
          </h4>

          <div className="grid gap-4 rounded-2xl border border-border p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">
                Owner Name
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {getValue(ownerName)}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Email
              </p>
              <p className="mt-1 break-all text-sm font-medium text-foreground">
                {getValue(email)}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Phone
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {getValue(phone)}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Joined On
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {formatDate(
                  vendor.createdAt ||
                    vendor.createdDate
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Business Type
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {getValue(
                  vendor.businessType ||
                    vendor.storeType
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                GST Number
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {getValue(
                  vendor.gstNumber ||
                    vendor.gst
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Store Information */}
        <section>
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Store Information
          </h4>

          <div className="grid gap-4 rounded-2xl border border-border p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">
                Store Name
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {getValue(
                  vendor.storeName ||
                    vendor.businessName
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Category
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {getValue(
                  vendor.category?.name ||
                    vendor.categoryName
                )}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">
                Description
              </p>
              <p className="mt-1 text-sm leading-6 text-foreground">
                {getValue(
                  vendor.description ||
                    vendor.storeDescription
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Address */}
        <section>
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Address
          </h4>

          <div className="rounded-2xl border border-border p-5">
            <p className="text-sm leading-6 text-foreground">
              {[
                address.street,
                address.addressLine1,
                address.addressLine2,
                address.city,
                address.state,
                address.pincode ||
                  address.postalCode,
                address.country,
              ]
                .filter(Boolean)
                .join(", ") || "N/A"}
            </p>
          </div>
        </section>

        {/* Statistics */}
        <section>
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Statistics
          </h4>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">
                Products
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {vendor.productCount ??
                  vendor.productsCount ??
                  0}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">
                Orders
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {vendor.orderCount ??
                  vendor.ordersCount ??
                  0}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">
                Rating
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {vendor.rating ??
                  vendor.averageRating ??
                  "0"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">
                Revenue
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                ₹
                {Number(
                  vendor.revenue ??
                    vendor.totalRevenue ??
                    0
                ).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </Button>

          {onStatusChange && (
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                onStatusChange(vendor)
              }
              disabled={loading}
            >
              Change Status
            </Button>
          )}

          {onEdit && (
            <Button
              type="button"
              onClick={() => onEdit(vendor)}
              disabled={loading}
            >
              Edit Vendor
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default VendorDetails;
