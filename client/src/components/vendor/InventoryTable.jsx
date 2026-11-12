import DataTable from "./DataTable";

const InventoryTable = ({
  products = [],
  loading = false,
  onEdit,
  onUpdateStock,
  onDelete,
}) => {
  const getStock = (product) =>
    Number(
      product?.stock ?? product?.quantity ?? product?.inventory?.stock ?? 0,
    );

  const getStatus = (stock) => {
    if (stock <= 0) {
      return {
        label: "Out of Stock",
        className: "status-badge red",
      };
    }

    if (stock <= 10) {
      return {
        label: "Low Stock",
        className: "status-badge amber",
      };
    }

    return {
      label: "In Stock",
      className: "status-badge green",
    };
  };

  const columns = [
    {
      key: "product",
      label: "Product",
      sortable: false,
      render: (product) => {
        const name = product?.name || product?.title || "Unnamed Product";

        const image =
          product?.images?.[0]?.url ||
          product?.images?.[0] ||
          product?.image ||
          product?.thumbnail;

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
                <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
                  SKU: {product.sku}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "category",
      label: "Category",
      render: (product) => (
        <span className="text-xs font-medium text-[var(--muted)]">
          {product?.category?.name || product?.categoryName || "—"}
        </span>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (product) => {
        const price = Number(product?.price ?? product?.sellingPrice ?? 0);

        return (
          <span className="text-xs font-black text-[var(--primary)]">
            ₹{price.toLocaleString("en-IN")}
          </span>
        );
      },
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
        const status = getStatus(getStock(product));

        return (
          <span className={status.className}>
            {status.label}
          </span>
        );
      },
    },
  ];

  const actions = (product) => (
    <div className="flex items-center justify-end gap-1.5">
      {onUpdateStock && (
        <button
          type="button"
          onClick={() => onUpdateStock(product)}
          className="btnsm"
        >
          Stock
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

  return (
    <DataTable
      columns={columns}
      data={products}
      loading={loading}
      emptyMessage="No inventory found."
      actions={onEdit || onUpdateStock || onDelete ? actions : undefined}
    />
  );
};

export default InventoryTable;


