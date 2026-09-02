import { useState } from "react";

import AdminHeader from "../../components/admin/AdminHeader";
import AdminSidebar from "../../components/admin/AdminSidebar";

import CouponTable from "../../components/admin/coupons/CouponTable";
import CouponForm from "../../components/admin/coupons/CouponForm";
import CouponStatusToggle from "../../components/admin/coupons/CouponStatusToggle";

const Coupons = ({
  user = null,
  coupons = [],
  totalCoupons = 0,
  loading = false,
  saving = false,

  notificationCount = 0,

  onCreateCoupon,
  onEditCoupon,
  onDeleteCoupon,
  onToggleCouponStatus,

  onLogout,
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const [formOpen, setFormOpen] = useState(false);

  const [statusCoupon, setStatusCoupon] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const handleCreate = () => {
    setSelectedCoupon(null);
    setFormOpen(true);
  };

  const handleEdit = (coupon) => {
    setSelectedCoupon(coupon);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (saving) return;

    setFormOpen(false);
    setSelectedCoupon(null);
  };

  const handleSubmit = async (couponData) => {
    if (saving) return;

    if (selectedCoupon) {
      await onEditCoupon?.(selectedCoupon, couponData);
    } else {
      await onCreateCoupon?.(couponData);
    }

    setFormOpen(false);
    setSelectedCoupon(null);
  };

  const handleDelete = async (coupon) => {
    if (saving) return;

    await onDeleteCoupon?.(coupon);
  };

  const handleStatusClick = (coupon) => {
    setStatusCoupon(coupon);
    setStatusOpen(true);
  };

  const handleCloseStatus = () => {
    if (saving) return;

    setStatusOpen(false);
    setStatusCoupon(null);
  };

  const handleToggleStatus = async (coupon) => {
    if (saving) return;

    await onToggleCouponStatus?.(coupon);

    setStatusOpen(false);
    setStatusCoupon(null);
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
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Coupons
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Create, update and manage discount coupons.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create Coupon
              </button>
            </div>

            {/* Coupon Count */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Total Coupons</p>

              <p className="text-2xl font-semibold">
                {totalCoupons || coupons.length}
              </p>
            </div>

            {/* Coupon Table */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <CouponTable
                coupons={coupons}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleStatusClick}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Coupon Form */}
      {formOpen && (
        <CouponForm
          key={selectedCoupon?._id || selectedCoupon?.id || "create-coupon"}
          coupon={selectedCoupon}
          open={formOpen}
          loading={saving}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
        />
      )}

      {/* Coupon Status */}
      {statusOpen && statusCoupon && (
        <CouponStatusToggle
          key={statusCoupon?._id || statusCoupon?.id || "coupon-status"}
          coupon={statusCoupon}
          open={statusOpen}
          loading={saving}
          onClose={handleCloseStatus}
          onConfirm={handleToggleStatus}
        />
      )}
    </div>
  );
};

export default Coupons;
