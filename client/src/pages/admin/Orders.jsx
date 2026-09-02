import { useState } from "react";

import AdminHeader from "../../components/admin/AdminHeader";
import AdminSidebar from "../../components/admin/AdminSidebar";

import OrderFilters from "../../components/admin/orders/OrderFilters";
import OrderTable from "../../components/admin/orders/OrderTable";
import OrderDetails from "../../components/admin/orders/OrderDetails";
import OrderStatus from "../../components/admin/orders/OrderStatus";

const Orders = ({
  user = null,
  orders = [],
  totalOrders = 0,
  loading = false,
  saving = false,
  filters = {},

  notificationCount = 0,

  onFilterChange,
  onViewOrder,
  onUpdateOrderStatus,
  onCancelOrder,
  onDeleteOrder,

  onLogout,
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [statusOrder, setStatusOrder] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);

    onViewOrder?.(order);
  };

  const handleCloseDetails = () => {
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
    if (!onUpdateOrderStatus || saving) return;

    await onUpdateOrderStatus(order, status);

    setStatusOpen(false);
    setStatusOrder(null);
  };

  const handleCancelOrder = async (order) => {
    if (!onCancelOrder || saving) return;

    await onCancelOrder(order);
  };

  const handleDeleteOrder = async (order) => {
    if (!onDeleteOrder || saving) return;

    await onDeleteOrder(order);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <AdminHeader
        user={user}
        notificationCount={notificationCount}
        onMenuClick={() => setSidebarOpen(true)}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />

        {/* Main Content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
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

            {/* Filters */}
            <div className="mb-6">
              <OrderFilters filters={filters} onChange={onFilterChange} />
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
      </div>

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
