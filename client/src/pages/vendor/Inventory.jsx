
import { useMemo, useState } from "react";

import VendorHeader from "../../components/vendor/VendorHeader";
import VendorSidebar from "../../components/vendor/VendorSidebar";

import InventoryTable from "../../components/vendor/InventoryTable";

import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";

const Inventory = ({
  user = null,
  products = [],
  loading = false,
  saving = false,
  notificationCount = 0,

  onUpdateStock,
  onViewProduct,
  onEditProduct,

  onNavigate,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  const handleNavigate = (item) => {
    setSidebarOpen(false);
    onNavigate?.(item);
  };

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const name = String(
        product?.name || ""
      ).toLowerCase();

      const sku = String(
        product?.sku || ""
      ).toLowerCase();

      const stock = Number(
        product?.stock ??
          product?.quantity ??
          0
      );

      let matchesStock = true;

      if (stockFilter === "out") {
        matchesStock = stock <= 0;
      }

      if (stockFilter === "low") {
        matchesStock = stock > 0 && stock <= 10;
      }

      if (stockFilter === "in") {
        matchesStock = stock > 10;
      }

      const matchesSearch =
        !keyword ||
        name.includes(keyword) ||
        sku.includes(keyword);

      return (
        matchesSearch &&
        matchesStock
      );
    });
  }, [products, search, stockFilter]);

  const totalStock = products.reduce(
    (total, product) =>
      total +
      Number(
        product?.stock ??
          product?.quantity ??
          0
      ),
    0
  );

  const outOfStock = products.filter(
    (product) =>
      Number(
        product?.stock ??
          product?.quantity ??
          0
      ) <= 0
  ).length;

  const lowStock = products.filter(
    (product) => {
      const stock = Number(
        product?.stock ??
          product?.quantity ??
          0
      );

      return stock > 0 && stock <= 10;
    }
  ).length;

  const handleStockUpdate = (
    product,
    value
  ) => {
    const stock = Number(value);

    if (Number.isNaN(stock) || stock < 0) {
      return;
    }

    onUpdateStock?.(
      product,
      stock
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <VendorSidebar
        activeItem="inventory"
        collapsed={false}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        mobileOpen={sidebarOpen}
        onMobileClose={() =>
          setSidebarOpen(false)
        }
      />

      {/* Main Content */}
      <div className="lg:pl-64">
        <VendorHeader
          title="Inventory"
          subtitle="Monitor and manage your product stock"
          user={user}
          notificationCount={notificationCount}
          onMenuClick={() =>
            setSidebarOpen(true)
          }
          onLogout={onLogout}
          onProfileClick={() =>
            handleNavigate("profile")
          }
          onNotificationsClick={() =>
            handleNavigate("notifications")
          }
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                  Inventory Management
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Keep track of stock levels across your store.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() =>
                  handleNavigate(
                    "products"
                  )
                }
              >
                Manage Products
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Total Products
                </p>

                <p className="mt-2 text-2xl font-bold text-foreground">
                  {products.length}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Total Stock
                </p>

                <p className="mt-2 text-2xl font-bold text-foreground">
                  {totalStock.toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Low Stock
                </p>

                <p className="mt-2 text-2xl font-bold text-warning">
                  {lowStock}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Out of Stock
                </p>

                <p className="mt-2 text-2xl font-bold text-destructive">
                  {outOfStock}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
              <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search product name or SKU..."
                />

                <Select
                  value={stockFilter}
                  onChange={(event) =>
                    setStockFilter(
                      event.target.value
                    )
                  }
                  options={[
                    {
                      label: "All Stock",
                      value: "all",
                    },
                    {
                      label: "In Stock",
                      value: "in",
                    },
                    {
                      label: "Low Stock",
                      value: "low",
                    },
                    {
                      label: "Out of Stock",
                      value: "out",
                    },
                  ]}
                />
              </div>
            </div>

            {/* Inventory */}
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-5">
                <h2 className="text-lg font-semibold text-foreground">
                  Product Inventory
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Update stock quantities directly from the table.
                </p>
              </div>

              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <Loader />
                </div>
              ) : filteredProducts.length ===
                0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No products found"
                    description={
                      search ||
                      stockFilter !== "all"
                        ? "Try changing your search or stock filter."
                        : "You don't have any products in your inventory yet."
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <InventoryTable
                    products={
                      filteredProducts
                    }
                    saving={saving}
                    onUpdateStock={
                      handleStockUpdate
                    }
                    onViewProduct={
                      onViewProduct
                    }
                    onEditProduct={
                      onEditProduct
                    }
                  />
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Inventory;
