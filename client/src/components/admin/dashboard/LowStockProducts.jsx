const LowStockProducts = ({
  products = [],
  fallbackProducts = [],
  loading = false,
  onViewProduct,
  onViewAll,
}) => {
  const hasLowStock = products.length > 0;
  const items = hasLowStock
    ? products.slice(0, 5)
    : [...fallbackProducts]
        .sort((a, b) => Number(a.stock ?? 0) - Number(b.stock ?? 0))
        .slice(0, 5);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xs dark:bg-card">
        <div className="h-5 w-40 animate-pulse rounded bg-[var(--soft)]" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:bg-card dark:border-line">
      <div className="flex items-center justify-between border-b border-[var(--line)] p-5">
        <div>
          <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
            Low stock inventory
          </h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            {hasLowStock || !items.length
              ? "Products with 10 or fewer units remaining"
              : "No items below 10 units · Showing lowest stock catalog items"}
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="cursor-pointer text-xs font-bold text-[var(--primary)] hover:underline"
        >
          Manage catalog →
        </button>
      </div>

      {!items.length ? (
        <div className="p-8 text-center text-xs text-[var(--muted)]">
          All catalog products are well stocked right now.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[#fcf9fa] text-[11px] font-black uppercase tracking-wider text-[var(--muted)] dark:bg-card/40">
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Seller</th>
                <th className="px-5 py-3.5">Price</th>
                <th className="px-5 py-3.5">Stock</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p, idx) => {
                const stock = Number(p.stock ?? 0);
                const outOfStock = stock <= 0;
                const isLow = stock <= 10;
                const categoryName =
                  typeof p.category === "object" ? p.category?.name : "";
                const vendorName =
                  typeof p.vendorId === "object" ? p.vendorId?.storeName : "";

                return (
                  <tr
                    key={p._id || p.id || idx}
                    className="border-b border-[#f0e8eb] transition hover:bg-[var(--soft)]/30 dark:border-line"
                  >
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-bold text-[var(--text)] dark:text-foreground">
                        {p.name || "Product"}
                      </div>
                      {categoryName && (
                        <div className="text-[11px] text-[var(--muted)]">
                          {categoryName}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-[var(--muted)]">
                      {vendorName || "ShopSphere Store"}
                    </td>

                    <td className="px-5 py-3.5 text-xs font-black text-[var(--text)]">
                      ₹{Number(p.price ?? 0).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                          outOfStock
                            ? "bg-[#ffeaec] text-[#bd3345]"
                            : isLow
                              ? "bg-[#fff4df] text-[#9b6814]"
                              : "bg-[#e7f6ef] text-[#16845b]"
                        }`}
                      >
                        {outOfStock
                          ? "Out of stock"
                          : isLow
                            ? `${stock} left`
                            : `${stock} in stock`}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onViewProduct?.(p)}
                        className="btnsm cursor-pointer text-[11px] !py-1 !px-2.5"
                      >
                        {isLow ? "Restock" : "View"}
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

export default LowStockProducts;
