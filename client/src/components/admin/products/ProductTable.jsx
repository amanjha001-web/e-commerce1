

const ProductTable = ({
  products = [],
  loading = false,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleStatus,
  onApproveProduct,
  onRejectProduct,
}) => {
  const getProductName = (product) =>
    product?.name ||
    product?.productName ||
    product?.title ||
    "Unnamed Product";

  const getCategory = (product) =>
    product?.category?.name ||
    product?.categoryName ||
    product?.category ||
    "N/A";

  const getVendorName = (product) =>
    product?.vendor?.businessName ||
    product?.vendor?.storeName ||
    product?.vendor?.name ||
    product?.vendorName ||
    "N/A";

  const getPrice = (product) =>
    product?.sellingPrice ?? product?.salePrice ?? product?.price ?? 0;

  const getStock = (product) =>
    product?.stock ?? product?.quantity ?? product?.inventory ?? 0;

  const getStatus = (product) => {
    // Prioritize isActive over status for accurate display
    if (product?.isActive === false) {
      return "inactive";
    }

    if (product?.isActive === true || product?.isActive === undefined) {
      if (product?.status) {
        return String(product.status).toLowerCase();
      }
      return "active";
    }

    // Fallback to status if isActive is set but not explicitly true/false
    if (product?.status) {
      return String(product.status).toLowerCase();
    }

    return "active";
  };

  const getImage = (product) =>
    product?.thumbnail ||
    product?.image ||
    product?.featuredImage ||
    product?.images?.[0]?.url ||
    product?.images?.[0] ||
    null;

  const getInitials = (product) =>
    getProductName(product)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

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

  const formatStatus = (status) =>
    status.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  const getStatusClasses = (status) => {
    switch (status) {
      case "active":
      case "published":
      case "approved":
        return "bg-green-100 text-green-700";

      case "draft":
      case "pending":
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

  const getStockClasses = (stock) => {
    const quantity = Number(stock || 0);

    if (quantity <= 0) {
      return "text-red-600";
    }

    if (quantity <= 10) {
      return "text-yellow-600";
    }

    return "text-green-600";
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        {/* Desktop Loading */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  "Product",
                  "Category",
                  "Vendor",
                  "Price",
                  "Stock",
                  "Status",
                  "Added",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: 6 }).map((_, index) => (
                <tr
                  key={index}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />

                      <div className="space-y-2">
                        <div className="h-3 w-36 animate-pulse rounded bg-muted" />
                        <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-3 w-12 animate-pulse rounded bg-muted" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Loading */}
        <div className="space-y-3 p-4 md:hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />

                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="rounded-2xl border border-border bg-background px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl">
          📦
        </div>

        <h3 className="mt-4 text-base font-semibold text-foreground">
          No products found
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          There are no products available to display.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Product
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Vendor
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Price
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Stock
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Added
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => {
              const status = getStatus(product);
              const image = getImage(product);
              const stock = Number(getStock(product) || 0);

              return (
                <tr
                  key={product?._id || product?.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-muted/20"
                >
                  {/* Product */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {image ? (
                        <img
                          src={image}
                          alt={getProductName(product)}
                          className="h-11 w-11 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
                          {getInitials(product)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onViewProduct?.(product)}
                          className="max-w-[230px] truncate text-left text-sm font-semibold text-foreground transition hover:text-primary"
                        >
                          {getProductName(product)}
                        </button>

                        {(product?.sku || product?.productCode) && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            SKU: {product?.sku || product?.productCode}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {getCategory(product)}
                  </td>

                  {/* Vendor */}
                  <td className="px-5 py-4 text-sm text-foreground">
                    {getVendorName(product)}
                  </td>

                  {/* Price */}
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-foreground">
                      {formatCurrency(getPrice(product))}
                    </div>

                    {product?.mrp &&
                      Number(product.mrp) > Number(getPrice(product)) && (
                        <div className="text-xs text-muted-foreground line-through">
                          {formatCurrency(product.mrp)}
                        </div>
                      )}
                  </td>

                  {/* Stock */}
                  <td className="px-5 py-4">
                    <span
                      className={`text-sm font-semibold ${getStockClasses(
                        stock,
                      )}`}
                    >
                      {stock}
                    </span>

                    {stock <= 0 && (
                      <p className="mt-0.5 text-[11px] text-red-500">
                        Out of stock
                      </p>
                    )}

                    {stock > 0 && stock <= 10 && (
                      <p className="mt-0.5 text-[11px] text-yellow-600">
                        Low stock
                      </p>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                        status,
                      )}`}
                    >
                      {formatStatus(status)}
                    </span>
                  </td>

                  {/* Added */}
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {formatDate(
                      product?.createdAt ||
                        product?.created_at ||
                        product?.addedAt,
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* View */}
                      <button
                        type="button"
                        onClick={() => onViewProduct?.(product)}
                        className="rounded-lg border border-border px-2 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
                      >
                        View
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => onEditProduct?.(product)}
                        className="rounded-lg border border-border px-2 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
                      >
                        Edit
                      </button>

                      {/* Toggle - only visible for published/active products that can be enabled/disabled */}
                      {(product?.status === "published" || product?.status === "active") && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus?.(product)}
                          title={
                            product?.isActive === false
                              ? "Activate product"
                              : "Deactivate product"
                          }
                          className={`rounded-lg border border-border px-2 py-2 text-xs font-medium transition ${
                            product?.isActive === false
                              ? "text-green-600 border-green-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600"
                              : "text-red-500 border-red-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                          }`}
                        >
                          {product?.isActive === false ? "Enable" : "Disable"}
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDeleteProduct?.(product)}
                        className="rounded-lg border border-border px-2 py-2 text-xs font-medium text-red-500 transition hover:border-red-500 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 p-4 md:hidden">
        {products.map((product) => {
          const status = getStatus(product);
          const image = getImage(product);
          const stock = Number(getStock(product) || 0);

          return (
            <div key={`mobile-${product?._id || product?.id}`}
              className="rounded-xl border border-border p-4"
            >
              {/* Product Header */}
              <div className="flex items-start gap-3">
                {image ? (
                  <img
                    src={image}
                    alt={getProductName(product)}
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
                    {getInitials(product)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onViewProduct?.(product)}
                    className="block max-w-full truncate text-left text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {getProductName(product)}
                  </button>

                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {getCategory(product)}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                    status,
                  )}`}
                >
                  {formatStatus(status)}
                </span>
              </div>

              {/* Details */}
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">Vendor</p>

                  <p className="mt-1 truncate text-sm font-medium text-foreground">
                    {getVendorName(product)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground">Price</p>

                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatCurrency(getPrice(product))}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground">Stock</p>

                  <p
                    className={`mt-1 text-sm font-semibold ${getStockClasses(
                      stock,
                    )}`}
                  >
                    {stock}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground">Added</p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatDate(
                      product?.createdAt ||
                        product?.created_at ||
                        product?.addedAt,
                    )}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 grid grid-cols-4 gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => onViewProduct?.(product)}
                  className="rounded-lg border border-border px-2 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
                >
                  View
                </button>

                <button
                  type="button"
                  onClick={() => onEditProduct?.(product)}
                  className="rounded-lg border border-border px-2 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
                >
                  Edit
                </button>

                {/* Toggle - only visible for published/active products that can be enabled/disabled */}
                {(product?.status === "published" || product?.status === "active") && (
                  <button
                    type="button"
                    onClick={() => onToggleStatus?.(product)}
                    className={`rounded-lg border border-border px-2 py-2 text-xs font-medium transition ${
                      product?.isActive === false
                        ? "text-green-600 border-green-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600"
                        : "text-red-500 border-red-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                    }`}
                  >
                    {product?.isActive === false ? "Enable" : "Disable"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onDeleteProduct?.(product)}
                  className="rounded-lg border border-border px-2 py-2 text-xs font-medium text-red-500 transition hover:border-red-500 hover:bg-red-50"
                >
                  Delete
                </button>

                {product?.status === "pending_approval" && onApproveProduct && (
                  <button
                    type="button"
                    onClick={() => onApproveProduct?.(product)}
                    className="rounded-lg border border-border px-2 py-2 text-xs font-medium text-green-600 transition hover:border-green-600 hover:bg-green-50"
                  >
                    Approve
                  </button>
                )}

                {product?.status === "pending_approval" && onRejectProduct && (
                  <button
                    type="button"
                    onClick={() => onRejectProduct?.(product)}
                    className="rounded-lg border border-border px-2 py-2 text-xs font-medium text-red-500 transition hover:border-red-500 hover:bg-red-50"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductTable;
