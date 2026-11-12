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
    return product?.name || product?.productName || "Product";
  };

  const getPrice = (product) => {
    return Number(
      product?.price ?? product?.sellingPrice ?? product?.salePrice ?? 0,
    );
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xs dark:bg-card">
        <div className="h-5 w-32 animate-pulse rounded bg-[var(--soft)]" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:bg-card dark:border-line">
      <div className="flex items-center justify-between border-b border-[var(--line)] p-5">
        <div>
          <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
            Top performing products
          </h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Best-selling items in your marketplace
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-bold text-[var(--primary)] hover:underline"
        >
          View all →
        </button>
      </div>

      {!topProducts.length ? (
        <div className="p-8 text-center text-xs text-[var(--muted)]">
          No product sales data available yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[#fcf9fa] text-[11px] font-black uppercase tracking-wider text-[var(--muted)] dark:bg-card/40">
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Price</th>
                <th className="px-5 py-3.5">Sales</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => {
                const id = p._id || p.id;
                const sales = Number(p.totalSales ?? p.sales ?? p.sold ?? 0);
                return (
                  <tr
                    key={id || Math.random()}
                    className="border-b border-[#f0e8eb] transition hover:bg-[var(--soft)]/30 dark:border-line"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-xs text-[var(--text)] dark:text-foreground">
                        {getProductName(p)}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        {p.category?.name || p.category || "Collection"}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-xs font-black text-[var(--primary)]">
                      ₹{getPrice(p).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-3.5 text-xs font-bold text-[var(--text)] dark:text-foreground">
                      {sales} sold
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onViewProduct?.(p)}
                        className="btnsm text-[11px] !py-1 !px-2.5"
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
      )}
    </div>
  );
};

export default TopProducts;
