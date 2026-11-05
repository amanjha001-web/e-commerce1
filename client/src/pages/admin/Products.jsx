import { useCallback, useEffect, useState } from "react";
import adminService from "../../services/admin.service";

import ProductFilters from "../../components/admin/products/ProductFilters";
import ProductTable from "../../components/admin/products/ProductTable";
import ProductDetails from "../../components/admin/products/ProductDetails";
import ProductStatusToggle from "../../components/admin/products/ProductStatusToggle";

const Products = () => {
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    brand: "",
    status: "",
    approvalStatus: "",
    page: 1,
    limit: 20,
    sortBy: "newest",
  });

  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusProduct, setStatusProduct] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  /* eslint-disable no-unused-vars */
  const [error, setError] = useState("");
  /* eslint-enable no-unused-vars */

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminService.getAdminProducts(filters);
      const data = response?.data ?? response;
      setProducts(data?.products || []);
      setTotalProducts(data?.pagination?.total || data?.products?.length || 0);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchProducts();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1,
    }));
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    if (loading) return;
    setDetailsOpen(false);
    setSelectedProduct(null);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setDetailsOpen(true);
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Delete product "${product.name}"?`)) return;
    if (!window.confirm("This action cannot be undone. Are you sure?")) return;
    setSaving(true);
    try {
      await adminService.deleteProduct(product._id);
      fetchProducts();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete product");
    } finally {
      setSaving(false);
    }
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
    if (!status || saving) return;
    setSaving(true);
    try {
      await adminService.updateProduct(product._id, { isActive: status });
      fetchProducts();
      if (selectedProduct?._id === product._id) {
        setProducts((prev) =>
          prev.map((p) => (p._id === product._id ? { ...p, isActive: status } : p))
        );
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update status");
    } finally {
      setSaving(false);
      setStatusOpen(false);
      setStatusProduct(null);
    }
  };

  /* eslint-disable no-unused-vars */
  const handleApproveProduct = async (product) => {
    if (!window.confirm(`Approve product "${product.name}"?`)) return;
    setSaving(true);
    try {
      await adminService.approveProduct(product._id);
      fetchProducts();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to approve product");
    } finally {
      setSaving(false);
    }
  };

  const handleRejectProduct = async (product) => {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason) return;
    setSaving(true);
    try {
      await adminService.rejectProduct(product._id, reason);
      fetchProducts();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to reject product");
    } finally {
      setSaving(false);
    }
  };
  /* eslint-enable no-unused-vars */

  // Update ProductFilters to use correct handler name
  useEffect(() => {
    // This is for the ProductFilters which uses onFilterChange
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">
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
            <ProductFilters filters={filters} onChange={handleFilterChange} />
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
