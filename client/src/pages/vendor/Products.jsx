
import { useMemo, useState } from "react";

import VendorHeader from "../../components/vendor/VendorHeader";
import VendorSidebar from "../../components/vendor/VendorSidebar";

import ProductTable from "../../components/vendor/ProductTable";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";

const Products = ({
  user = null,
  products = [],
  loading = false,
  notificationCount = 0,

  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleStatus,
  onNavigate,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

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

      const productStatus = String(
        product?.status || ""
      ).toLowerCase();

      const matchesSearch =
        !keyword ||
        name.includes(keyword) ||
        sku.includes(keyword);

      const matchesStatus =
        status === "all" ||
        productStatus === status;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [products, search, status]);

  const totalProducts = products.length;

  const activeProducts = products.filter(
    (product) =>
      String(
        product?.status || ""
      ).toLowerCase() === "active"
  ).length;

  const inactiveProducts = products.filter(
    (product) =>
      String(
        product?.status || ""
      ).toLowerCase() === "inactive"
  ).length;

  const outOfStockProducts = products.filter(
    (product) =>
      Number(
        product?.stock ??
          product?.quantity ??
          0
      ) <= 0
  ).length;

  return (
    <div className="min-h-screen bg-muted/30">
      <VendorSidebar
        activeItem="products"
        collapsed={false}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        mobileOpen={sidebarOpen}
        onMobileClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="lg:pl-64">
        <VendorHeader
          title="Products"
          subtitle="Manage your store products and inventory"
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
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                  Products
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  View, edit and manage all products in your store.
                </p>
              </div>

              <Button
                onClick={() =>
                  handleNavigate(
                    "add-product"
                  )
                }
              >
                Add Product
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Total Products
                </p>

                <p className="mt-2 text-2xl font-bold text-foreground">
                  {totalProducts}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Active Products
                </p>

                <p className="mt-2 text-2xl font-bold text-success">
                  {activeProducts}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Inactive Products
                </p>

                <p className="mt-2 text-2xl font-bold text-warning">
                  {inactiveProducts}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Out of Stock
                </p>

                <p className="mt-2 text-2xl font-bold text-destructive">
                  {outOfStockProducts}
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
                  placeholder="Search by product name or SKU..."
                />

                <Select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value
                    )
                  }
                  options={[
                    {
                      label: "All Products",
                      value: "all",
                    },
                    {
                      label: "Active",
                      value: "active",
                    },
                    {
                      label: "Inactive",
                      value: "inactive",
                    },
                    {
                      label: "Draft",
                      value: "draft",
                    },
                  ]}
                />
              </div>
            </div>

            {/* Product Table */}
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Product List
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your products from the table below.
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
                      status !== "all"
                        ? "Try changing your search or filter."
                        : "You have not added any products yet."
                    }
                    action={
                      !search &&
                      status === "all" ? (
                        <Button
                          onClick={() =>
                            handleNavigate(
                              "add-product"
                            )
                          }
                        >
                          Add Product
                        </Button>
                      ) : null
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <ProductTable
                    products={
                      filteredProducts
                    }
                    onViewProduct={
                      onViewProduct
                    }
                    onEditProduct={
                      onEditProduct
                    }
                    onDeleteProduct={
                      onDeleteProduct
                    }
                    onToggleStatus={
                      onToggleStatus
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

export default Products;
