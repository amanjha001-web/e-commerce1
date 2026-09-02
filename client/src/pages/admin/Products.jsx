import { useState } from "react";

import AdminHeader from "../../components/admin/AdminHeader";
import AdminSidebar from "../../components/admin/AdminSidebar";

import ProductFilters from "../../components/admin/products/ProductFilters";
import ProductTable from "../../components/admin/products/ProductTable";
import ProductDetails from "../../components/admin/products/ProductDetails";
import ProductStatusToggle from "../../components/admin/products/ProductStatusToggle";

const Products = ({
  user = null,

  products = [],
  totalProducts = 0,
  loading = false,
  saving = false,
  filters = {},

  notificationCount = 0,

  onFilterChange,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleProductStatus,

  onLogout,
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [statusProduct, setStatusProduct] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setDetailsOpen(true);

    onViewProduct?.(product);
  };

  const handleCloseDetails = () => {
    if (loading) return;

    setDetailsOpen(false);
    setSelectedProduct(null);
  };

  const handleEditProduct = (product) => {
    onEditProduct?.(product);
  };

  const handleDeleteProduct = (product) => {
    onDeleteProduct?.(product);
  };

  const handleStatusClick = (product) => {
    setStatusProduct(product);
    setStatusOpen(true);
  };

  const handleCloseStatus = () => {
    if (saving) return;

    setStatusOpen(false);
    setStatusProduct(null);
  };

  const handleToggleStatus = async (product, status) => {
    if (!onToggleProductStatus || saving) return;

    await onToggleProductStatus(product, status);

    setStatusOpen(false);
    setStatusProduct(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader
        user={user}
        notificationCount={notificationCount}
        onMenuClick={() => setSidebarOpen(true)}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <div className="flex">
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Products
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage products, pricing, inventory and product status.
              </p>
            </div>

            {/* Filters */}
            <div className="mb-6">
              <ProductFilters filters={filters} onChange={onFilterChange} />
            </div>

            {/* Product Count */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Total Products</p>

              <p className="text-2xl font-semibold">
                {totalProducts || products.length}
              </p>
            </div>

            {/* Product Table */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <ProductTable
                products={products}
                loading={loading}
                onView={handleViewProduct}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onToggleStatus={handleStatusClick}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Product Details */}
      {detailsOpen && selectedProduct && (
        <ProductDetails
          key={selectedProduct?._id || selectedProduct?.id || "product-details"}
          product={selectedProduct}
          open={detailsOpen}
          loading={loading}
          onClose={handleCloseDetails}
          onEdit={handleEditProduct}
          onToggleStatus={handleStatusClick}
        />
      )}

      {/* Product Status */}
      {statusOpen && statusProduct && (
        <ProductStatusToggle
          key={statusProduct?._id || statusProduct?.id || "product-status"}
          product={statusProduct}
          open={statusOpen}
          loading={saving}
          onClose={handleCloseStatus}
          onConfirm={handleToggleStatus}
        />
      )}
    </div>
  );
};

export default Products;
