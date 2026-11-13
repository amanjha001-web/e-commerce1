
import { useEffect, useMemo, useState } from "react";
import couponService from "../../services/coupon.service";
import { toast } from "sonner";

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
  coupons: propCoupons = [],
  loading: propLoading = false,
  saving: propSaving = false,
  onCreateCoupon,
  onUpdateCoupon,
  onDeleteCoupon,
  onToggleCoupon,
}) => {
  const [internalCoupons, setInternalCoupons] = useState([]);
  const [internalLoading, setInternalLoading] = useState(!propCoupons?.length);
  const [internalSaving, setInternalSaving] = useState(false);

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

  const coupons = propCoupons?.length > 0 ? propCoupons : internalCoupons;
  const loading = propCoupons?.length > 0 ? propLoading : internalLoading;
  const saving = propSaving || internalSaving;

  const loadCoupons = async () => {
    try {
      setInternalLoading(true);
      const res = await couponService.getVendorCoupons();
      const list = res?.data?.coupons || res?.data || res?.coupons || [];
      setInternalCoupons(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load vendor coupons:", err);
    } finally {
      setInternalLoading(false);
    }
  };

  useEffect(() => {
    if (!propCoupons || propCoupons.length === 0) {
      loadCoupons();
    }
  }, [propCoupons]);

 

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
      code: form.code.trim().toUpperCase(),
      description: form.description,
      discountType: form.discountType,
      discountAmount: Number(form.discountValue || 0),
      discountValue: Number(form.discountValue || 0),
      minPurchaseAmount: form.minimumOrderAmount ? Number(form.minimumOrderAmount) : 0,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      expiryDate: form.expiresAt ? new Date(form.expiresAt) : new Date(Date.now() + 30 * 86400000),
      isActive: form.status === "active",
    };

    setInternalSaving(true);
    try {
      if (editingCoupon) {
        if (onUpdateCoupon) {
          await onUpdateCoupon(editingCoupon, payload);
        } else {
          await couponService.updateVendorCoupon(editingCoupon._id || editingCoupon.id, payload);
          toast.success("Coupon updated successfully");
          await loadCoupons();
        }
      } else {
        if (onCreateCoupon) {
          await onCreateCoupon(payload);
        } else {
          await couponService.createVendorCoupon(payload);
          toast.success("Store coupon created successfully");
          await loadCoupons();
        }
      }
      setModalOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save coupon");
    } finally {
      setInternalSaving(false);
    }
  };

  const handleDelete = async (coupon) => {
    if (onDeleteCoupon) return onDeleteCoupon(coupon);
    const id = coupon?._id || coupon?.id;
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      setInternalSaving(true);
      await couponService.deleteVendorCoupon(id);
      toast.success("Coupon deleted");
      await loadCoupons();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete coupon");
    } finally {
      setInternalSaving(false);
    }
  };

  const handleToggle = async (coupon) => {
    const nextActive = String(coupon?.status || "active").toLowerCase() !== "active";
    if (onToggleCoupon) return onToggleCoupon(coupon, nextActive);
    const id = coupon?._id || coupon?.id;
    try {
      setInternalSaving(true);
      await couponService.updateVendorCoupon(id, { isActive: nextActive });
      toast.success(`Coupon marked ${nextActive ? "Active" : "Inactive"}`);
      await loadCoupons();
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setInternalSaving(false);
    }
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
          <span className={active ? "status-badge green" : "status-badge"}>
            {active ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (coupon) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => openEditModal(coupon)}
            className="btnsm primary"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => handleToggle(coupon)}
            className="btnsm"
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
            className="btnsm text-[var(--red)] border-[#f3cbd0] hover:bg-[#fff0f1]"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div>
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="eyebrow">Promotions & Marketing</div>
                <h1 className="text-2xl font-black text-[var(--text)] dark:text-foreground">
                  Store Coupons
                </h1>

                <p className="mt-1 text-xs font-medium text-[var(--muted)]">
                  Manage discounts and promotional offers.
                </p>
              </div>

              <Button
                onClick={openCreateModal}
                className="primarybtn"
              >
                + Create Coupon
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
            <div className="panel p-4">
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
            <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:border-line dark:bg-card">
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
