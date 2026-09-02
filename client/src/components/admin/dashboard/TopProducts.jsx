import { useMemo } from "react";

const TopProducts = ({
  products = [],
  loading = false,
  onViewProduct,
  onViewAll,
}) => {
  const topProducts = useMemo(() => {
    return [...products]
      .sort(
        (a, b) =>
          Number(b.totalSales ?? b.sales ?? b.sold ?? 0) -
          Number(a.totalSales ?? a.sales ?? a.sold ?? 0),
      )
      .slice(0, 5);
  }, [products]);

  const getProductName = (product) => {
    return product?.name || product?.productName || "Unnamed Product";
  };

  const getProductImage = (product) => {
    return product?.thumbnail || product?.image || product?.images?.[0] || null;
  };

  const getSales = (product) => {
    return Number(product?.totalSales ?? product?.sales ?? product?.sold ?? 0);
  };

  const getRevenue = (product) => {
    return Number(
      product?.totalRevenue ?? product?.revenue ?? product?.salesAmount ?? 0,
    );
  };

  const getPrice = (product) => {
    return Number(
      product?.price ?? product?.sellingPrice ?? product?.salePrice ?? 0,
    );
  };

  const getInitials = (product) => {
    return getProductName(product)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="h-6 w-36 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-28 animate-pulse rounded bg-muted" />
          </div>

          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>

        <div className="space-y-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />

              <div className="flex-1">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted" />
              </div>

              <div className="h-5 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-background shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Top Products
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Best performing products
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-medium text-primary transition hover:opacity-80"
        >
          View All
        </button>
      </div>

      {/* Empty State */}
      {!topProducts.length ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
            🏆
          </div>

          <h3 className="text-sm font-semibold text-foreground">
            No products found
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Top selling products will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-4 font-medium">#</th>

                  <th className="px-6 py-4 font-medium">Product</th>

                  <th className="px-6 py-4 font-medium">Price</th>

                  <th className="px-6 py-4 font-medium">Units Sold</th>

                  <th className="px-6 py-4 font-medium">Revenue</th>

                  <th className="px-6 py-4 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {topProducts.map((product, index) => {
                  const image = getProductImage(product);

                  return (
                    <tr
                      key={product?._id || product?.id || index}
                      className="border-b border-border last:border-0 transition hover:bg-muted/30"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-muted-foreground">
                          {index + 1}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {image ? (
                            <img
                              src={image}
                              alt={getProductName(product)}
                              className="h-11 w-11 rounded-lg border border-border object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                              {getInitials(product)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate font-medium text-foreground">
                              {getProductName(product)}
                            </p>

                            {product?.category?.name && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {product.category.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-foreground">
                        ₹{getPrice(product).toLocaleString("en-IN")}
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-foreground">
                          {getSales(product).toLocaleString("en-IN")}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-foreground">
                          ₹{getRevenue(product).toLocaleString("en-IN")}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => onViewProduct?.(product)}
                          className="text-sm font-medium text-primary transition hover:opacity-80"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="divide-y divide-border md:hidden">
            {topProducts.map((product, index) => {
              const image = getProductImage(product);

              return (
                <div key={product?._id || product?.id || index} className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </div>

                    {image ? (
                      <img
                        src={image}
                        alt={getProductName(product)}
                        className="h-12 w-12 rounded-lg border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(product)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {getProductName(product)}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {getSales(product).toLocaleString("en-IN")} sold
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>

                      <p className="mt-1 font-medium text-foreground">
                        ₹{getPrice(product).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Revenue</p>

                      <p className="mt-1 font-semibold text-foreground">
                        ₹{getRevenue(product).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewProduct?.(product)}
                    className="mt-4 w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                  >
                    View Product
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default TopProducts;
