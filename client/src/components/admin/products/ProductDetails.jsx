import { useState } from "react";

const ProductDetails = ({
  product = null,
  open = false,
  loading = false,
  onClose,
  onEdit,
  onToggleStatus,
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!open || !product) {
    return null;
  }

  const getProductName = () =>
    product?.name ||
    product?.productName ||
    product?.title ||
    "Unnamed Product";

  const getImage = () =>
    product?.thumbnail ||
    product?.image ||
    product?.featuredImage ||
    product?.images?.[0]?.url ||
    product?.images?.[0] ||
    null;

  const getCategory = () =>
    product?.category?.name ||
    product?.categoryName ||
    product?.category ||
    "N/A";

  const getVendorName = () =>
    product?.vendor?.businessName ||
    product?.vendor?.storeName ||
    product?.vendor?.name ||
    product?.vendorName ||
    "N/A";

  const getVendorEmail = () =>
    product?.vendor?.email ||
    product?.vendorEmail ||
    product?.seller?.email ||
    "N/A";

  const getPrice = () =>
    product?.sellingPrice ?? product?.salePrice ?? product?.price ?? 0;

  const getStock = () =>
    product?.stock ?? product?.quantity ?? product?.inventory ?? 0;

  const getStatus = () => {
    if (product?.status) {
      return String(product.status).toLowerCase();
    }

    return product?.isActive === false ? "inactive" : "active";
  };

  const getInitials = () =>
    getProductName()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const formatDateTime = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatStatus = (value) =>
    String(value)
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const getStatusClasses = (value) => {
    switch (value) {
      case "active":
      case "published":
      case "approved":
        return "bg-green-100 text-green-700";

      case "pending":
      case "draft":
      case "under_review":
        return "bg-yellow-100 text-yellow-700";

      case "inactive":
      case "blocked":
      case "rejected":
      case "archived":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const status = getStatus();
  const image = getImage();
  const stock = Number(getStock() || 0);

  const specifications =
    product?.specifications || product?.attributes || product?.variants || {};

  const description =
    product?.description ||
    product?.shortDescription ||
    "No product description available.";

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  const tabs = [
    ["overview", "Overview"],
    ["pricing", "Pricing & Stock"],
    ["specifications", "Specifications"],
    ["activity", "Activity"],
  ];

  const isActiveStatus = status === "active" || status === "published";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={handleBackdropClick}
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {image ? (
              <img
                src={image}
                alt={getProductName()}
                className="h-12 w-12 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                {getInitials()}
              </div>
            )}

            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">
                {getProductName()}
              </h2>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                    status,
                  )}`}
                >
                  {formatStatus(status)}
                </span>

                {product?.sku && (
                  <span className="text-xs text-muted-foreground">
                    SKU: {product.sku}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-border px-5 sm:px-6">
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`whitespace-nowrap border-b-2 py-3 text-sm font-medium transition ${
                  activeTab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="space-y-5">
              <div className="h-40 animate-pulse rounded-2xl bg-muted" />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-xl bg-muted"
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Overview */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Product Image + Description */}
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr]">
                    <div className="overflow-hidden rounded-2xl border border-border bg-muted/20">
                      {image ? (
                        <img
                          src={image}
                          alt={getProductName()}
                          className="h-60 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-60 items-center justify-center text-5xl text-muted-foreground">
                          📦
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Product Description
                      </h3>

                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                        {description}
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Category
                          </p>

                          <p className="mt-1 text-sm font-medium text-foreground">
                            {getCategory()}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Vendor
                          </p>

                          <p className="mt-1 truncate text-sm font-medium text-foreground">
                            {getVendorName()}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Stock</p>

                          <p
                            className={`mt-1 text-sm font-semibold ${
                              stock <= 0
                                ? "text-red-600"
                                : stock <= 10
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }`}
                          >
                            {stock}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-foreground">
                      Product Information
                    </h3>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        ["Product ID", product?._id || product?.id || "N/A"],
                        ["SKU", product?.sku || product?.productCode || "N/A"],
                        ["Category", getCategory()],
                        ["Vendor", getVendorName()],
                        ["Vendor Email", getVendorEmail()],
                        [
                          "Brand",
                          product?.brand?.name || product?.brand || "N/A",
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-xl border border-border p-4"
                        >
                          <p className="text-xs text-muted-foreground">
                            {label}
                          </p>

                          <p className="mt-1 truncate text-sm font-medium text-foreground">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing */}
              {activeTab === "pricing" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">
                        Selling Price
                      </p>

                      <p className="mt-2 text-xl font-bold text-foreground">
                        {formatCurrency(getPrice())}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">MRP</p>

                      <p className="mt-2 text-xl font-bold text-foreground">
                        {formatCurrency(product?.mrp ?? getPrice())}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">Discount</p>

                      <p className="mt-2 text-xl font-bold text-green-600">
                        {product?.discountPercentage != null
                          ? `${product.discountPercentage}%`
                          : product?.discount != null
                            ? formatCurrency(product.discount)
                            : "N/A"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">
                        Available Stock
                      </p>

                      <p
                        className={`mt-2 text-xl font-bold ${
                          stock <= 0
                            ? "text-red-600"
                            : stock <= 10
                              ? "text-yellow-600"
                              : "text-green-600"
                        }`}
                      >
                        {stock}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border p-5">
                    <h3 className="text-sm font-semibold text-foreground">
                      Inventory Information
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Stock Quantity
                        </p>

                        <p className="mt-1 text-sm font-medium text-foreground">
                          {stock}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Low Stock Threshold
                        </p>

                        <p className="mt-1 text-sm font-medium text-foreground">
                          {product?.lowStockThreshold ?? 10}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Reserved Stock
                        </p>

                        <p className="mt-1 text-sm font-medium text-foreground">
                          {product?.reservedStock ?? 0}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Sold Quantity
                        </p>

                        <p className="mt-1 text-sm font-medium text-foreground">
                          {product?.totalSold ??
                            product?.sold ??
                            product?.sales ??
                            0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Specifications */}
              {activeTab === "specifications" && (
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-foreground">
                    Product Specifications
                  </h3>

                  {Object.keys(specifications).length > 0 ? (
                    <div className="overflow-hidden rounded-2xl border border-border">
                      {Object.entries(specifications).map(
                        ([key, value], index) => (
                          <div
                            key={key}
                            className={`grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-2 ${
                              index % 2 === 0 ? "bg-muted/20" : "bg-background"
                            }`}
                          >
                            <span className="text-sm font-medium capitalize text-foreground">
                              {key.replace(/[_-]/g, " ")}
                            </span>

                            <span className="text-sm text-muted-foreground sm:text-right">
                              {typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value)}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
                      <div className="text-3xl">📋</div>

                      <p className="mt-3 text-sm font-medium text-foreground">
                        No specifications available
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        This product does not have any specifications added.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Activity */}
              {activeTab === "activity" && (
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-foreground">
                    Product Activity
                  </h3>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-border p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm">
                          📦
                        </div>

                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Product Created
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDateTime(product?.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {product?.updatedAt && (
                      <div className="rounded-xl border border-border p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm">
                            ✏️
                          </div>

                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Product Updated
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDateTime(product.updatedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {product?.approvedAt && (
                      <div className="rounded-xl border border-border p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm">
                            ✓
                          </div>

                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Product Approved
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDateTime(product.approvedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Close
          </button>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => onEdit?.(product)}
              className="rounded-xl border border-primary px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/5"
            >
              Edit Product
            </button>

            <button
              type="button"
              onClick={() => onToggleStatus?.(product)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white transition ${
                isActiveStatus
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isActiveStatus ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
