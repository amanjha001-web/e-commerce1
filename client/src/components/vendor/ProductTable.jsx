import DataTable from "./DataTable";

const ProductTable = ({
  products = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const getProductName = (product) =>
    product?.name || product?.title || "Unnamed Product";

  const getImage = (product) =>
    product?.images?.[0]?.url ||
    product?.images?.[0] ||
    product?.image ||
    product?.thumbnail;

  const getPrice = (product) =>
    Number(product?.price ?? product?.sellingPrice ?? 0);

  const getStock = (product) =>
    Number(
      product?.stock ?? product?.quantity ?? product?.inventory?.stock ?? 0,
    );

  const getStatus = (product) => {
    if (product?.isActive !== undefined) {
      return product.isActive ? "Active" : "Inactive";
    }

    return product?.status || "active";
  };

  const getStatusClass = (status) => {
    const normalized = String(status).toLowerCase();

    if (["active", "published"].includes(normalized)) {
      return "status-badge green";
    }

    return "status-badge";
  };

  const columns = [
    {
      key: "product",
      label: "Product",
      sortable: false,
      render: (product) => {
        const name = getProductName(product);

        const image = getImage(product);

        return (
          <div className="flex items-center gap-3">
            {image ? (
              <img
                src={image}
                alt={name}
                className="h-11 w-11 rounded-xl object-cover border border-[var(--line)]"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--soft)] border border-[var(--line)] text-base">
                📦
              </div>
            )}

            <div className="min-w-0">
              <p className="max-w-[220px] truncate text-xs font-bold text-[var(--text)] dark:text-foreground">
                {name}
              </p>

              {product?.sku && (
                <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">SKU: {product.sku}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "category",
      label: "Category",
      sortable: false,
      render: (product) => (
        <span className="text-xs font-medium text-[var(--muted)]">
          {product?.category?.name || product?.categoryName || "—"}
        </span>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (product) => (
        <span className="text-xs font-black text-[var(--primary)]">
          ₹{getPrice(product).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "stock",
      label: "Stock",
      render: (product) => {
        const stock = getStock(product);

        return (
          <span
            className={
              stock <= 0
                ? "text-xs font-black text-[var(--red)]"
                : stock <= 10
                  ? "text-xs font-black text-[var(--amber)]"
                  : "text-xs font-bold text-[var(--text)]"
            }
          >
            {stock.toLocaleString("en-IN")}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: false,
      render: (product) => {
        const status = getStatus(product);

        return (
          <span className={getStatusClass(status)}>
            {String(status).replace(/_/g, " ")}
          </span>
        );
      },
    },
  ];

  const actions = (product) => {
    const status = String(getStatus(product)).toLowerCase();

    return (
      <div className="flex items-center justify-end gap-1.5">
        {onView && (
          <button
            type="button"
            onClick={() => onView(product)}
            className="btnsm"
          >
            View
          </button>
        )}

        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="btnsm primary"
          >
            Edit
          </button>
        )}

        {onToggleStatus && (
          <button
            type="button"
            onClick={() => onToggleStatus(product)}
            className="btnsm"
          >
            {status === "active" ? "Disable" : "Enable"}
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(product)}
            className="btnsm text-[var(--red)] border-[#f3cbd0] hover:bg-[#fff0f1]"
          >
            Delete
          </button>
        )}
      </div>
    );
  };

  return (
    <DataTable
      columns={columns}
      data={products}
      loading={loading}
      emptyMessage="No products found."
      actions={
        onView || onEdit || onDelete || onToggleStatus ? actions : undefined
      }
    />
  );
};

export default ProductTable;


