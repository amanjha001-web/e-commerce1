import { useCallback, useEffect, useState } from "react";
import adminService from "../../services/admin.service";

import ProductFilters from "../../components/admin/products/ProductFilters";
import ProductTable from "../../components/admin/products/ProductTable";
import ProductDetails from "../../components/admin/products/ProductDetails";
import ProductStatusToggle from "../../components/admin/products/ProductStatusToggle";

const Products = () => {
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    category: "all",
    vendor: "all",
    stock: "all",
    page: 1,
    limit: 20,
    sortBy: "newest",
  });

  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [totalPendingProducts, setTotalPendingProducts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusProduct, setStatusProduct] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("all"); // "all" or "pending"
  const [editProduct, setEditProduct] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Build API params from filters - map frontend names to backend names
  const buildApiParams = useCallback(() => {
    const apiParams = {
      page: filters.page,
      limit: filters.limit,
    };

    // Search
    if (filters.search?.trim()) {
      apiParams.search = filters.search.trim();
    }

    // Status mapping: frontend "active"/"inactive" -> backend "isActive"
    if (filters.status === "active") {
      apiParams.isActive = true;
    } else if (filters.status === "inactive") {
      apiParams.isActive = false;
    } else if (filters.status && filters.status !== "all") {
      // For other statuses (draft, pending, published, rejected), pass as-is
      apiParams.status = filters.status;
    }

    // Category - only send if not "all"
    if (filters.category && filters.category !== "all") {
      apiParams.category = filters.category;
    }

    // Vendor filter - backend does not support vendorStatus filter (requires complex join)
    // Only specific vendor IDs could be filtered, not by status
    // Removed vendorStatus sending as it's not supported by backend

    // Stock filter - backend supports this
    if (filters.stock && filters.stock !== "all") {
      if (filters.stock === "in_stock") {
        apiParams.stockStatus = "in_stock";
      } else if (filters.stock === "low_stock") {
        apiParams.stockStatus = "low_stock";
      } else if (filters.stock === "out_of_stock") {
        apiParams.stockStatus = "out_of_stock";
      }
    }

    // Sorting
    if (filters.sortBy && filters.sortBy !== "newest") {
      switch (filters.sortBy) {
        case "oldest":
          apiParams.sortBy = "createdAt";
          apiParams.sortOrder = "asc";
          break;
        case "name_asc":
          apiParams.sortBy = "name";
          apiParams.sortOrder = "asc";
          break;
        case "name_desc":
          apiParams.sortBy = "name";
          apiParams.sortOrder = "desc";
          break;
        case "price_low":
          apiParams.sortBy = "price";
          apiParams.sortOrder = "asc";
          break;
        case "price_high":
          apiParams.sortBy = "price";
          apiParams.sortOrder = "desc";
          break;
        case "stock_low":
          apiParams.sortBy = "stock";
          apiParams.sortOrder = "asc";
          break;
        case "stock_high":
          apiParams.sortBy = "stock";
          apiParams.sortOrder = "desc";
          break;
        default:
          break;
      }
    }

    return apiParams;
  }, [filters]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const apiParams = buildApiParams();
      const response = await adminService.getAdminProducts(apiParams);
      // Handle ApiResponse structure: { statusCode, data: { products, pagination }, message, success }
      const data = response?.data ?? response;
      setProducts(data?.products || []);
      setTotalProducts(
        data?.pagination?.total || data?.products?.length || 0,
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch products",
      );
    } finally {
      setLoading(false);
    }
  }, [buildApiParams]);

  const fetchPendingProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminService.getPendingProducts();
      const data = response?.data ?? response;
      setPendingProducts(data?.products || []);
      setTotalPendingProducts(data?.pagination?.total || data?.products?.length || 0);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to fetch pending products");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch products when view mode or filters change
  useEffect(() => {
    if (viewMode === "pending") {
      fetchPendingProducts();
    } else {
      fetchProducts();
    }
  }, [viewMode, filters, fetchProducts, fetchPendingProducts]);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "all",
      category: "all",
      vendor: "all",
      stock: "all",
      page: 1,
      limit: 20,
      sortBy: "newest",
    });
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
    setEditProduct(product);
    setEditForm({
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price || "",
      stock: product?.stock || "",
      category: product?.category?._id || product?.category || "",
      status: product?.status || "active",
    });
    setEditOpen(true);
  };

  const handleCloseEditModal = () => {
    if (saving) return;
    setEditOpen(false);
    setEditProduct(null);
    setEditForm({});
  };

  const handleUpdateProduct = async () => {
    if (!editProduct?._id) return;
    setSaving(true);
    setError("");
    try {
      await adminService.updateProduct(editProduct._id, {
        ...editForm,
        price: Number(editForm.price),
        stock: Number(editForm.stock),
      });
      setEditOpen(false);
      setEditProduct(null);
      if (viewMode === "pending") {
        fetchPendingProducts();
      } else {
        fetchProducts();
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Delete product "${product.name}"? This action cannot be undone.`)) return;
    setSaving(true);
    setError("");
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

  const handleApproveProduct = async (product) => {
    if (!window.confirm(`Approve product "${product.name}"?`)) return;
    setSaving(true);
    setError("");
    try {
      await adminService.approveProduct(product._id);
      if (viewMode === "pending") {
        fetchPendingProducts();
      } else {
        fetchProducts();
      }
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
    setError("");
    try {
      await adminService.rejectProduct(product._id, reason);
      if (viewMode === "pending") {
        fetchPendingProducts();
      } else {
        fetchProducts();
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to reject product");
    } finally {
      setSaving(false);
    }
  };

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

          {/* Tabs */}
          <div className="mb-4 flex space-x-2">
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                viewMode === "all"
                  ? "bg-primary text-white"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              All Products
            </button>
            <button
              type="button"
              onClick={() => setViewMode("pending")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                viewMode === "pending"
                  ? "bg-primary text-white"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              Pending Products
            </button>
          </div>

          {/* Error Alert */}
          {error && !loading && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="mb-6">
            <ProductFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              loading={loading}
            />
          </div>

          {/* Product Count */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Total Products
            </p>

            <p className="text-2xl font-semibold">
              {viewMode === "pending" ? totalPendingProducts : totalProducts}
            </p>
          </div>

          {/* Product Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <ProductTable
              products={viewMode === "pending" ? pendingProducts : products}
              loading={loading}
              onViewProduct={handleViewProduct}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onToggleStatus={handleStatusClick}
              onApproveProduct={handleApproveProduct}
              onRejectProduct={handleRejectProduct}
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

      {/* Edit Product Modal */}
      {editOpen && editProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-foreground">Edit Product</h2>
            </div>

            <div className="px-5 py-5 space-y-4">
              <div>
                <label
                  htmlFor="edit-product-name"
                  className="mb-1.5 block text-xs font-medium text-foreground"
                >
                  Product Name
                </label>
                <input
                  id="edit-product-name"
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-product-price"
                  className="mb-1.5 block text-xs font-medium text-foreground"
                >
                  Price
                </label>
                <input
                  id="edit-product-price"
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-product-stock"
                  className="mb-1.5 block text-xs font-medium text-foreground"
                >
                  Stock
                </label>
                <input
                  id="edit-product-stock"
                  type="number"
                  value={editForm.stock}
                  onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="border-t border-border px-5 py-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseEditModal}
                disabled={saving}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdateProduct}
                disabled={saving}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
