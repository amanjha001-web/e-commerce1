import { useMemo, useState } from "react";
import { toast } from "sonner";

const DEMO_COUPONS = [
  {
    code: "WELCOME10",
    discount: "10%",
    discountType: "percentage",
    discountValue: 10,
    usage: "428",
    expiry: "31 Dec 2026",
    status: "Active",
    isActive: true,
    statusClass: "green",
    isDemo: true,
  },
  {
    code: "FESTIVE20",
    discount: "20%",
    discountType: "percentage",
    discountValue: 20,
    usage: "182",
    expiry: "30 Nov 2026",
    status: "Scheduled",
    isActive: false,
    statusClass: "amber",
    isDemo: true,
  },
];

const formatDate = (date) => {
  if (!date) return "31 Dec 2026";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Coupons = ({
  coupons = [],
  couponUsage = null,
  saving = false,
  onInspectCoupon,
  onCreateCoupon,
  onEditCoupon,
  onDeleteCoupon,
  onToggleCouponStatus,
}) => {
  const [demoCoupons, setDemoCoupons] = useState(DEMO_COUPONS);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "10",
    usageLimit: "100",
    expiryDate: "2026-12-31",
    description: "",
  });

  const rows = useMemo(() => {
    const source = coupons.length > 0 ? coupons : demoCoupons;
    return source.map((c) => {
      if (c.code && c.discount && c.statusClass) return c;

      const code = c.code || c.name || "COUPON";
      const discount =
        c.discountType === "fixed"
          ? `₹${c.discountValue || c.discount || 0}`
          : `${c.discountValue || c.discount || 10}%`;
      const usage = String(c.usedCount ?? c.usageCount ?? c.usage ?? 0);
      const expiry = formatDate(c.expiryDate || c.expiresAt || c.expiry);
      const isActive = c.isActive !== false;
      const status = isActive ? "Active" : "Scheduled";
      const statusClass = status === "Active" ? "green" : "amber";

      return {
        ...c,
        code,
        discount,
        usage,
        expiry,
        isActive,
        status,
        statusClass,
      };
    });
  }, [coupons, demoCoupons]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) =>
      `${r.code} ${r.discount} ${r.usage} ${r.expiry} ${r.status}`
        .toLowerCase()
        .includes(q),
    );
  }, [rows, search]);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setForm({
      code: "",
      discountType: "percentage",
      discountValue: "10",
      usageLimit: "100",
      expiryDate: "2026-12-31",
      description: "",
    });
    setModalOpen(true);
    toast.success("New coupons form opened");
  };

  const handleOpenEdit = (c) => {
    setEditingCoupon(c);
    setForm({
      code: c.code || "",
      discountType: c.discountType || "percentage",
      discountValue: String(
        c.discountValue || String(c.discount || "10").replace(/[^\d]/g, "") || 10,
      ),
      usageLimit: String(c.usageLimit || 100),
      expiryDate: c.expiryDate
        ? String(c.expiryDate).slice(0, 10)
        : "2026-12-31",
      description: c.description || "",
    });
    setModalOpen(true);
    if (!c.isDemo && c._id) {
      onInspectCoupon?.(c._id);
    }
  };

  const handleSaveCoupon = async () => {
    const code = form.code.trim().toUpperCase();
    if (!code) {
      setModalOpen(false);
      return;
    }

    const payload = {
      code,
      discountType: form.discountType,
      discountValue: Number(form.discountValue) || 10,
      usageLimit: Number(form.usageLimit) || 100,
      startDate: new Date().toISOString(),
      expiryDate: new Date(form.expiryDate || "2026-12-31").toISOString(),
      description: form.description.trim(),
      isActive: true,
    };

    if (editingCoupon) {
      if (!editingCoupon.isDemo && editingCoupon._id) {
        try {
          await onEditCoupon?.(editingCoupon, payload);
          toast.success("Coupon edited");
        } catch (err) {
          toast.error(err?.message || "Failed to update coupon");
        }
      } else {
        setDemoCoupons((prev) =>
          prev.map((item) =>
            item.code === editingCoupon.code
              ? {
                  ...item,
                  code,
                  discount:
                    form.discountType === "fixed"
                      ? `₹${payload.discountValue}`
                      : `${payload.discountValue}%`,
                }
              : item,
          ),
        );
        toast.success("Coupon edited");
      }
    } else {
      try {
        await onCreateCoupon?.(payload);
        toast.success("Coupon created");
      } catch {
        setDemoCoupons((prev) => [
          ...prev,
          {
            code,
            discount:
              form.discountType === "fixed"
                ? `₹${payload.discountValue}`
                : `${payload.discountValue}%`,
            usage: "0",
            expiry: formatDate(payload.expiryDate),
            status: "Active",
            isActive: true,
            statusClass: "green",
            isDemo: true,
          },
        ]);
        toast.success("Coupon created");
      }
    }

    setModalOpen(false);
    setEditingCoupon(null);
  };

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Coupons</h1>
        </div>
      </div>

      <div className="panel">
        <div className="toolbar">
          <input
            className="field"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="primarybtn"
            onClick={handleOpenCreate}
          >
            + Add new
          </button>
        </div>

        <div id="simpleTable" className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Usage</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id || c.code}>
                  <td>{c.code}</td>
                  <td>{c.discount}</td>
                  <td>{c.usage}</td>
                  <td>{c.expiry}</td>
                  <td>
                    <span className={`status ${c.statusClass}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btnsm"
                      onClick={() => handleOpenEdit(c)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>{editingCoupon ? "Edit coupon" : "Create coupon"}</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {editingCoupon &&
              couponUsage &&
              couponUsage.code === editingCoupon.code && (
                <div className="notice" style={{ marginBottom: "12px" }}>
                  <b>Usage stats:</b> {couponUsage.usedCount} /{" "}
                  {couponUsage.usageLimit} used ({couponUsage.usagePercentage}%)
                  · {couponUsage.remainingUses} remaining
                </div>
              )}

            <div className="formgrid">
              <div className="formgroup">
                <label>Coupon code</label>
                <input
                  className="field full"
                  placeholder="WELCOME10"
                  value={form.code}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, code: e.target.value }))
                  }
                />
              </div>
              <div className="formgroup">
                <label>Discount type</label>
                <select
                  className="field full"
                  value={form.discountType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      discountType: e.target.value,
                    }))
                  }
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (₹)</option>
                </select>
              </div>
              <div className="formgroup">
                <label>Discount value</label>
                <input
                  type="number"
                  className="field full"
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      discountValue: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="formgroup">
                <label>Expiry date</label>
                <input
                  type="date"
                  className="field full"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      expiryDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginTop: "14px",
              }}
            >
              <button
                type="button"
                className="primarybtn"
                disabled={saving}
                onClick={handleSaveCoupon}
              >
                Save coupon
              </button>
              {editingCoupon && (
                <>
                  <button
                    type="button"
                    className="btnsm"
                    disabled={saving}
                    onClick={async () => {
                      const nextActive = !editingCoupon.isActive;
                      if (!editingCoupon.isDemo && editingCoupon._id) {
                        try {
                          await onToggleCouponStatus?.(
                            editingCoupon,
                            nextActive,
                          );
                          toast.success(
                            nextActive
                              ? "Coupon activated"
                              : "Coupon deactivated",
                          );
                          setModalOpen(false);
                        } catch (err) {
                          toast.error(err?.message || "Failed to update status");
                        }
                      } else {
                        setDemoCoupons((prev) =>
                          prev.map((item) =>
                            item.code === editingCoupon.code
                              ? {
                                  ...item,
                                  isActive: nextActive,
                                  status: nextActive ? "Active" : "Scheduled",
                                  statusClass: nextActive ? "green" : "amber",
                                }
                              : item,
                          ),
                        );
                        toast.success(
                          nextActive
                            ? "Coupon activated"
                            : "Coupon deactivated",
                        );
                        setModalOpen(false);
                      }
                    }}
                  >
                    {editingCoupon.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    className="btnsm"
                    disabled={saving}
                    onClick={async () => {
                      if (!editingCoupon.isDemo && editingCoupon._id) {
                        try {
                          await onDeleteCoupon?.(editingCoupon);
                          toast.success("Coupon deleted");
                          setModalOpen(false);
                        } catch (err) {
                          toast.error(err?.message || "Failed to delete coupon");
                        }
                      } else {
                        setDemoCoupons((prev) =>
                          prev.filter(
                            (item) => item.code !== editingCoupon.code,
                          ),
                        );
                        toast.success("Coupon deleted");
                        setModalOpen(false);
                      }
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
