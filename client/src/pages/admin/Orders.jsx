import { useCallback, useEffect, useState } from "react";
import adminService from "../../services/admin.service";

import OrderFilters from "../../components/admin/orders/OrderFilters";
import OrderTable from "../../components/admin/orders/OrderTable";
import OrderDetails from "../../components/admin/orders/OrderDetails";
import OrderStatus from "../../components/admin/orders/OrderStatus";

const Orders = () => {
  const [filters, setFilters] = useState({
    status: "",
    paymentStatus: "",
    page: 1,
    limit: 20,
  });

  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusOrder, setStatusOrder] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminService.getOrders(filters);
      const data = response?.data ?? response;
      setOrders(data?.orders || []);
      setTotalOrders(data?.pagination?.total || data?.orders?.length || 0);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchOrders();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1,
    }));
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    if (loading) return;
    setDetailsOpen(false);
    setSelectedOrder(null);
  };

  const handleStatusClick = (order) => {
    setStatusOrder(order);
    setStatusOpen(true);
  };

  const handleCloseStatus = () => {
    if (saving) return;
    setStatusOpen(false);
    setStatusOrder(null);
  };

  const handleUpdateStatus = async (order, status) => {
    if (!status || saving) return;
    setSaving(true);
    setError("");
    try {
      await adminService.updateOrderStatus(order._id, status);
      fetchOrders();
      if (selectedOrder?._id === order._id) {
        setOrders((prev) =>
          prev.map((o) => (o._id === order._id ? { ...o, status } : o))
        );
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update status");
    } finally {
      setSaving(false);
      setStatusOpen(false);
      setStatusOrder(null);
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Cancel order #${order._id}?`)) return;
    setSaving(true);
    try {
      await adminService.cancelOrder(order._id, "Customer requested cancellation");
      fetchOrders();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to cancel order");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrder = async (order) => {
    if (!window.confirm(`Delete order #${order._id}? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await adminService.deleteProduct(order._id);
      if (selectedOrder?._id === order._id) {
        setDetailsOpen(false);
        setSelectedOrder(null);
      }
      fetchOrders();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete order");
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
              Orders
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage customer orders, status and order information.
            </p>
          </div>

          {/* Error Alert */}
          {error && !loading && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="mb-6">
            <OrderFilters filters={filters} onChange={handleFilterChange} />
          </div>

          {/* Order Count */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">Total Orders</p>

            <p className="text-2xl font-semibold">
              {totalOrders || orders.length}
            </p>
          </div>

          {/* Orders Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <OrderTable
              orders={orders}
              loading={loading}
              onView={handleViewOrder}
              onStatusChange={handleStatusClick}
              onCancel={handleCancelOrder}
              onDelete={handleDeleteOrder}
            />
          </div>
        </div>
      </main>

      {/* Order Details */}
      {detailsOpen && selectedOrder && (
        <OrderDetails
          key={selectedOrder?._id || selectedOrder?.id || "order-details"}
          order={selectedOrder}
          open={detailsOpen}
          loading={loading}
          onClose={handleCloseDetails}
          onStatusChange={handleStatusClick}
          onCancel={handleCancelOrder}
        />
      )}

      {/* Order Status */}
      {statusOpen && statusOrder && (
        <OrderStatus
          key={statusOrder?._id || statusOrder?.id || "order-status"}
          order={statusOrder}
          open={statusOpen}
          loading={saving}
          onClose={handleCloseStatus}
          onConfirm={handleUpdateStatus}
        />
      )}
    </div>
  );
};

export default Orders;
