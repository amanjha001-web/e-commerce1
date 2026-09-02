
import { useState } from "react";

import AdminHeader from "../../components/admin/AdminHeader";
import AdminSidebar from "../../components/admin/AdminSidebar";

import PaymentTable from "../../components/admin/payments/PaymentTable";
import PaymentDetails from "../../components/admin/payments/PaymentDetails";
import PaymentStatus from "../../components/admin/payments/PaymentStatus";

const AdminPayments = ({
  user = null,
  payments = [],
  loading = false,
  saving = false,
  notificationCount = 0,

  onViewPayment,
  onEditPayment,
  onDeletePayment,
  onStatusChange,

  onLogout,
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedPayment, setSelectedPayment] =
    useState(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [statusPayment, setStatusPayment] =
    useState(null);

  const [statusOpen, setStatusOpen] =
    useState(false);

  const handleNavigate = (item) => {
    setSidebarOpen(false);
    onNavigate?.(item);
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setDetailsOpen(true);

    onViewPayment?.(payment);
  };

  const handleEditPayment = (payment) => {
    onEditPayment?.(payment);
  };

  const handleDeletePayment = (payment) => {
    onDeletePayment?.(payment);
  };

  const handleOpenStatus = (payment) => {
    setStatusPayment(payment);
    setStatusOpen(true);
  };

  const handleConfirmStatus = (
    payment,
    status,
    reason
  ) => {
    onStatusChange?.(
      payment,
      status,
      reason
    );

    setStatusOpen(false);
    setStatusPayment(null);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <AdminSidebar
        activeItem="payments"
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
        <AdminHeader
          title="Payments"
          subtitle="Monitor payment transactions and status"
          user={user}
          notificationCount={notificationCount}
          onMenuClick={() =>
            setSidebarOpen(true)
          }
          onLogout={onLogout}
          onProfileClick={() =>
            onNavigate?.("profile")
          }
          onNotificationsClick={() =>
            onNavigate?.("notifications")
          }
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  All Payments
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  View and manage payment transactions.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background px-4 py-2 text-sm shadow-sm">
                <span className="font-semibold text-foreground">
                  {payments.length}
                </span>

                <span className="ml-1 text-muted-foreground">
                  transactions
                </span>
              </div>
            </div>

            {/* Payment Table */}
            <PaymentTable
              payments={payments}
              loading={loading}
              onViewPayment={handleViewPayment}
              onEditPayment={handleEditPayment}
              onDeletePayment={handleDeletePayment}
              onStatusChange={handleOpenStatus}
            />
          </div>
        </main>
      </div>

      {/* Payment Details */}
      <PaymentDetails
        payment={selectedPayment}
        open={detailsOpen}
        loading={loading}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedPayment(null);
        }}
        onEdit={handleEditPayment}
        onStatusChange={handleOpenStatus}
      />

      {/* Payment Status */}
      <PaymentStatus
        payment={statusPayment}
        open={statusOpen}
        loading={saving}
        onClose={() => {
          setStatusOpen(false);
          setStatusPayment(null);
        }}
        onConfirm={handleConfirmStatus}
      />
    </div>
  );
};

export default AdminPayments;
