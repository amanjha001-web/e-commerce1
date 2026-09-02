
import { useMemo, useState } from "react";

import VendorHeader from "../../components/vendor/VendorHeader";
import VendorSidebar from "../../components/vendor/VendorSidebar";

import DataTable from "../../components/vendor/DataTable";
import DashboardCard from "../../components/vendor/DashboardCard";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import Textarea from "../../components/common/Textarea";

const Coupons = ({
  user = null,
  coupons = [],
  loading = false,
  saving = false,
  notificationCount = 0,

  onCreateCoupon,
  onUpdateCoupon,
  onDeleteCoupon,
  onToggleCoupon,
  onLogout,
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minimumOrderAmount: "",
    usageLimit: "",
    expiresAt: "",
    status: "active",
  });

  const handleNavigate = (item) => {
    setSidebarOpen(false);
    onNavigate?.(item);
  };

  const filteredCoupons = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return coupons.filter((coupon) => {
      const couponStatus = String(
        coupon?.status || "active"
      ).toLowerCase();

      const code = String(
        coupon?.code || ""
      ).toLowerCase();

      const description = String(
        coupon?.description || ""
      ).toLowerCase();

      const matchesSearch =
        !keyword ||
        code.includes(keyword) ||
        description.includes(keyword);

      const matchesStatus =
        status === "all" ||
        couponStatus === status;

      return matchesSearch && matchesStatus;
    });
  }, [coupons, search, status]);

  const activeCount = coupons.filter(
    (coupon) =>
      String(coupon?.status || "active").toLowerCase() ===
      "active"
  ).length;

  const inactiveCount = coupons.filter(
    (coupon) =>
      String(coupon?.status || "").toLowerCase() ===
      "inactive"
  ).length;

  const resetForm = () => {
    setForm({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minimumOrderAmount: "",
      usageLimit: "",
      expiresAt: "",
      status: "active",
    });

    setEditingCoupon(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);

    setForm({
      code: coupon?.code || "",
      description: coupon?.description || "",
      discountType:
        coupon?.discountType || "percentage",
      discountValue:
        coupon?.discountValue ??
        coupon?.value ??
        "",
      minimumOrderAmount:
        coupon?.minimumOrderAmount ?? "",
      usageLimit:
        coupon?.usageLimit ?? "",
      expiresAt:
        coupon?.expiresAt
          ? String(coupon.expiresAt).slice(0, 10)
          : "",
      status: coupon?.status || "active",
    });

    setModalOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      discountValue: Number(form.discountValue),
      minimumOrderAmount: form.minimumOrderAmount
        ? Number(form.minimumOrderAmount)
        : 0,
      usageLimit: form.usageLimit
        ? Number(form.usageLimit)
        : undefined,
    };

    if (editingCoupon) {
      await onUpdateCoupon?.(
        editingCoupon,
        payload
      );
    } else {
      await onCreateCoupon?.(payload);
    }

    setModalOpen(false);
    resetForm();
  };

  const handleDelete = (coupon) => {
    onDeleteCoupon?.(coupon);
  };

  const handleToggle = (coupon) => {
    onToggleCoupon?.(
      coupon,
      String(coupon?.status || "active").toLowerCase() !==
        "active"
    );
  };

  const columns = [
    {
      key: "code",
      label: "Coupon",
      render: (coupon) => (
        <div>
          <p className="font-semibold text-foreground">
            {coupon?.code || "—"}
          </p>

          {coupon?.description && (
            <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
              {coupon.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "discount",
      label: "Discount",
      render: (coupon) => {
        const type =
          coupon?.discountType || "percentage";

        const value =
          coupon?.discountValue ??
          coupon?.value ??
          0;

        return (
          <span className="font-medium">
            {type === "percentage"
              ? `${value}%`
              : `₹${value}`}
          </span>
        );
      },
    },
    {
      key: "minimumOrderAmount",
      label: "Min. Order",
      render: (coupon) => (
        <span>
          ₹
          {Number(
            coupon?.minimumOrderAmount || 0
          ).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "usage",
      label: "Usage",
      render: (coupon) => (
        <span>
          {coupon?.usedCount ??
            coupon?.usageCount ??
            0}
          {coupon?.usageLimit
            ? ` / ${coupon.usageLimit}`
            : ""}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (coupon) => {
        const active =
          String(
            coupon?.status || "active"
          ).toLowerCase() === "active";

        return (
          <span
            className={[
              "rounded-full px-2.5 py-1 text-xs font-medium",
              active
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground",
            ].join(" ")}
          >
            {active ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (coupon) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openEditModal(coupon)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => handleToggle(coupon)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
          >
            {String(
              coupon?.status || "active"
            ).toLowerCase() === "active"
              ? "Disable"
              : "Enable"}
          </button>

          <button
            type="button"
            onClick={() => handleDelete(coupon)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/10"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <VendorSidebar
        activeItem="coupons"
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
          title="Coupons"
          subtitle="Create and manage discount coupons for your store"
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
                  Store Coupons
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Manage discounts and promotional offers.
                </p>
              </div>

              <Button
                onClick={openCreateModal}
              >
                Create Coupon
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <DashboardCard
                title="Total Coupons"
                value={coupons.length}
              />

              <DashboardCard
                title="Active Coupons"
                value={activeCount}
              />

              <DashboardCard
                title="Inactive Coupons"
                value={inactiveCount}
              />
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="w-full md:max-w-md">
                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search coupon code..."
                  />
                </div>

                <div className="w-full md:w-48">
                  <Select
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target.value
                      )
                    }
                    options={[
                      {
                        label: "All Coupons",
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
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <Loader />
                </div>
              ) : filteredCoupons.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No coupons found"
                    description={
                      search || status !== "all"
                        ? "Try changing your search or filter."
                        : "Create your first coupon to offer discounts to customers."
                    }
                  />

                  {!search &&
                    status === "all" && (
                      <div className="mt-5 flex justify-center">
                        <Button
                          onClick={
                            openCreateModal
                          }
                        >
                          Create Coupon
                        </Button>
                      </div>
                    )}
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredCoupons}
                  loading={loading}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            resetForm();
          }
        }}
        title={
          editingCoupon
            ? "Edit Coupon"
            : "Create Coupon"
        }
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <Input
            label="Coupon Code"
            name="code"
            value={form.code}
            onChange={handleChange}
            placeholder="SAVE20"
            required
          />

          <Textarea
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe this offer..."
            rows={3}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Discount Type"
              name="discountType"
              value={form.discountType}
              onChange={handleChange}
              options={[
                {
                  label: "Percentage",
                  value: "percentage",
                },
                {
                  label: "Fixed Amount",
                  value: "fixed",
                },
              ]}
            />

            <Input
              label="Discount Value"
              name="discountValue"
              type="number"
              min="0"
              value={form.discountValue}
              onChange={handleChange}
              placeholder="20"
              required
            />

            <Input
              label="Minimum Order Amount"
              name="minimumOrderAmount"
              type="number"
              min="0"
              value={form.minimumOrderAmount}
              onChange={handleChange}
              placeholder="999"
            />

            <Input
              label="Usage Limit"
              name="usageLimit"
              type="number"
              min="1"
              value={form.usageLimit}
              onChange={handleChange}
              placeholder="100"
            />

            <Input
              label="Expiry Date"
              name="expiresAt"
              type="date"
              value={form.expiresAt}
              onChange={handleChange}
            />

            <Select
              label="Status"
              name="status"
              value={form.status}
              onChange={handleChange}
              options={[
                {
                  label: "Active",
                  value: "active",
                },
                {
                  label: "Inactive",
                  value: "inactive",
                },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingCoupon
                ? "Update Coupon"
                : "Create Coupon"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Coupons;
