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
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      };
    }

    if (stock <= 10) {
      return {
        label: "Low Stock",
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      };
    }

    return {
      label: "In Stock",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
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
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-lg dark:bg-gray-800">
                📦
              </div>
            )}

            <div className="min-w-0">
              <p className="max-w-[220px] truncate font-medium text-gray-900 dark:text-white">
                {name}
              </p>

              {product?.sku && (
                <p className="mt-0.5 text-xs text-gray-400">
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
      render: (product) =>
        product?.category?.name || product?.categoryName || "—",
    },
    {
      key: "price",
      label: "Price",
      render: (product) => {
        const price = Number(product?.price ?? product?.sellingPrice ?? 0);

        return (
          <span className="font-medium">₹{price.toLocaleString("en-IN")}</span>
        );
      },
    },
    {
      key: "stock",
      label: "Stock",
      render: (product) => {
        const stock = getStock(product);

        return (
          <span className="font-semibold">{stock.toLocaleString("en-IN")}</span>
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
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
          >
            {status.label}
          </span>
        );
      },
    },
  ];

  const actions = (product) => (
    <div className="flex items-center justify-end gap-2">
      {onUpdateStock && (
        <button
          type="button"
          onClick={() => onUpdateStock(product)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Stock
        </button>
      )}

      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/20"
        >
          Edit
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(product)}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
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
