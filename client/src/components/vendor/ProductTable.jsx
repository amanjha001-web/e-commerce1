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
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }

    return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
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
                <p className="mt-1 text-xs text-gray-400">SKU: {product.sku}</p>
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
      render: (product) =>
        product?.category?.name || product?.categoryName || "—",
    },
    {
      key: "price",
      label: "Price",
      render: (product) => (
        <span className="font-semibold">
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
                ? "font-semibold text-red-600"
                : stock <= 10
                  ? "font-semibold text-yellow-600"
                  : "font-semibold text-gray-700 dark:text-gray-300"
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
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusClass(
              status,
            )}`}
          >
            {String(status).replace(/_/g, " ")}
          </span>
        );
      },
    },
  ];

  const actions = (product) => {
    const status = String(getStatus(product)).toLowerCase();

    return (
      <div className="flex items-center justify-end gap-2">
        {onView && (
          <button
            type="button"
            onClick={() => onView(product)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            View
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

        {onToggleStatus && (
          <button
            type="button"
            onClick={() => onToggleStatus(product)}
            className="rounded-lg border border-yellow-200 px-3 py-1.5 text-xs font-medium text-yellow-600 transition hover:bg-yellow-50 dark:border-yellow-900 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
          >
            {status === "active" ? "Disable" : "Enable"}
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
