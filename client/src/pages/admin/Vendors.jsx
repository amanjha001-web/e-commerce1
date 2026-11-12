import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import VendorDetails from "../../components/admin/vendors/VendorDetails";
import VendorStatusToggle from "../../components/admin/vendors/VendorStatusToggle";

import {
  fetchAdminVendors,
  fetchAdminVendorById,
  updateAdminVendor,
  deleteAdminVendor,
  toggleAdminVendorStatus,
  approveAdminVendor,
  rejectAdminVendor,
  setSelectedVendor,
  clearSelectedVendor,
} from "../../store/slices/Admin/adminVendorsSlice";

const DEMO_VENDORS = [
  {
    id: "V-101",
    vendorCode: "V-101",
    shopName: "Northstar Store",
    email: "northstar@email.com",
    productCount: 42,
    orderCount: 128,
    statusLabel: "Active",
    isActive: true,
    isDemo: true,
  },
  {
    id: "V-102",
    vendorCode: "V-102",
    shopName: "Urban Living",
    email: "urban@email.com",
    productCount: 28,
    orderCount: 96,
    statusLabel: "Active",
    isActive: true,
    isDemo: true,
  },
  {
    id: "V-103",
    vendorCode: "V-103",
    shopName: "Aura Essentials",
    email: "aura@email.com",
    productCount: 0,
    orderCount: 0,
    statusLabel: "Pending",
    isActive: false,
    isDemo: true,
  },
];

const getStatusClass = (s) =>
  s === "Delivered" || s === "Active" || s === "Resolved" || s === "Published"
    ? "green"
    : s === "Pending" || s === "Processing" || s === "Open"
      ? "amber"
      : s === "Blocked" || s === "Cancelled" || s === "Rejected"
        ? "red"
        : "";

const Vendors = () => {
  const dispatch = useDispatch();

  const {
    vendors = [],
    selectedVendor = null,
    detailsLoading = false,
    saving = false,
  } = useSelector((state) => state.adminVendors || {});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All status");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [initialEdit, setInitialEdit] = useState(false);
  const [statusVendor, setStatusVendor] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [demoModalVendor, setDemoModalVendor] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminVendors());
  }, [dispatch]);

  const sourceVendors = vendors.length > 0 ? vendors : DEMO_VENDORS;

  const normalizedVendors = useMemo(() => {
    return sourceVendors.map((v, i) => {
      const code =
        v.vendorCode ||
        (v._id ? `V-${String(v._id).slice(-3).toUpperCase()}` : `V-${101 + i}`);
      const shop = v.shopName || v.storeName || v.businessName || "Shop";
      const email = v.email || v.user?.email || "—";
      const products = v.productCount ?? v.productsCount ?? 0;
      const orders = v.orderCount ?? v.ordersCount ?? 0;
      const statusLabel =
        v.statusLabel ||
        (v.status
          ? String(v.status).charAt(0).toUpperCase() +
            String(v.status).slice(1).toLowerCase()
          : v.isActive === false
            ? "Pending"
            : "Active");

      return {
        ...v,
        _displayCode: code,
        _displayShop: shop,
        _displayEmail: email,
        _displayProducts: products,
        _displayOrders: orders,
        _displayStatus: statusLabel,
      };
    });
  }, [sourceVendors]);

  const filteredVendors = useMemo(() => {
    return normalizedVendors.filter((v) => {
      if (
        statusFilter !== "All status" &&
        v._displayStatus.toLowerCase() !== statusFilter.toLowerCase()
      ) {
        return false;
      }

      if (search.trim()) {
        const text =
          `${v._displayCode} ${v._displayShop} ${v._displayEmail} ${v._displayStatus}`.toLowerCase();
        if (!text.includes(search.trim().toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [normalizedVendors, search, statusFilter]);

  const handleViewVendor = async (vendor) => {
    if (vendor.isDemo || !vendor._id) {
      setDemoModalVendor(vendor);
      toast.success("Vendor profile opened");
      return;
    }

    dispatch(setSelectedVendor(vendor));
    setInitialEdit(false);
    setDetailsOpen(true);
    dispatch(fetchAdminVendorById(vendor._id));
  };

  const handleManageVendor = (vendor) => {
    if (vendor.isDemo || !vendor._id) {
      toast.success("Vendor action saved");
      return;
    }

    setStatusVendor(vendor);
    setStatusOpen(true);
  };

  const handleUpdateVendor = async (vendorId, vendorData) => {
    try {
      await dispatch(updateAdminVendor({ vendorId, vendorData })).unwrap();
      setInitialEdit(false);
      return true;
    } catch {
      return false;
    }
  };

  const handleCloseDetails = () => {
    if (detailsLoading || saving) return;
    setDetailsOpen(false);
    setInitialEdit(false);
    dispatch(clearSelectedVendor());
  };

  const handleDeleteVendor = async (vendor) => {
    const vendorId = vendor?._id;
    if (!vendorId) return;
    if (!window.confirm(`Delete "${vendor.shopName || "this vendor"}"?`)) return;
    const result = await dispatch(deleteAdminVendor(vendorId));
    if (deleteAdminVendor.fulfilled.match(result)) {
      handleCloseDetails();
    }
  };

  const handleToggleStatus = async (vendor, status) => {
    const vendorId = vendor?._id || vendor?.id;
    if (!vendorId || saving) return;
    const isActive =
      typeof status === "boolean"
        ? status
        : typeof status?.isActive === "boolean"
          ? status.isActive
          : !vendor.isActive;

    const result = await dispatch(
      toggleAdminVendorStatus({ vendorId, isActive }),
    );
    if (toggleAdminVendorStatus.fulfilled.match(result)) {
      setStatusOpen(false);
      setStatusVendor(null);
      dispatch(fetchAdminVendors());
    }
  };

  const handleApproveVendor = async (vendor) => {
    const vendorId = vendor?._id || vendor?.id;
    if (!vendorId || saving) return;
    const result = await dispatch(approveAdminVendor({ vendorId }));
    if (approveAdminVendor.fulfilled.match(result)) {
      dispatch(fetchAdminVendors());
    }
  };

  const handleRejectVendor = async (vendor) => {
    const vendorId = vendor?._id || vendor?.id;
    if (!vendorId || saving) return;
    const reason = window.prompt(
      "Enter rejection reason for vendor:",
      "Application did not meet verification requirements.",
    );
    if (reason === null) return;
    const result = await dispatch(
      rejectAdminVendor({
        vendorId,
        reason: reason.trim() || "Rejected by admin",
      }),
    );
    if (rejectAdminVendor.fulfilled.match(result)) {
      dispatch(fetchAdminVendors());
    }
  };

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Vendors</h1>
        </div>
      </div>

      <div className="panel">
        <div className="toolbar">
          <input
            className="field"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All status</option>
            <option>Active</option>
            <option>Pending</option>
          </select>
        </div>

        <div id="vendorTable" className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Shop</th>
                <th>Email</th>
                <th>Products</th>
                <th>Orders</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((v, i) => (
                <tr key={v._id || v.id || i}>
                  <td>{v._displayCode}</td>
                  <td>{v._displayShop}</td>
                  <td>{v._displayEmail}</td>
                  <td>{v._displayProducts}</td>
                  <td>{v._displayOrders}</td>
                  <td>
                    <span
                      className={`status ${getStatusClass(v._displayStatus)}`}
                    >
                      {v._displayStatus}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btnsm"
                      onClick={() => handleViewVendor(v)}
                    >
                      View
                    </button>{" "}
                    <button
                      type="button"
                      className="btnsm"
                      onClick={() => handleManageVendor(v)}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {demoModalVendor && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDemoModalVendor(null);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>{demoModalVendor._displayShop}</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setDemoModalVendor(null)}
              >
                ✕
              </button>
            </div>
            <p>
              <b>Vendor ID:</b> {demoModalVendor._displayCode}
            </p>
            <p>
              <b>Email:</b> {demoModalVendor._displayEmail}
            </p>
            <p>
              <b>Products:</b> {demoModalVendor._displayProducts} ·{" "}
              <b>Orders:</b> {demoModalVendor._displayOrders}
            </p>
            <p>
              <b>Status:</b>{" "}
              <span
                className={`status ${getStatusClass(
                  demoModalVendor._displayStatus,
                )}`}
              >
                {demoModalVendor._displayStatus}
              </span>
            </p>
          </div>
        </div>
      )}

      {detailsOpen && selectedVendor && (
        <VendorDetails
          key={selectedVendor._id || selectedVendor.id}
          vendor={selectedVendor}
          open={detailsOpen}
          loading={detailsLoading}
          saving={saving}
          initialEdit={initialEdit}
          onClose={handleCloseDetails}
          onUpdate={handleUpdateVendor}
          onDelete={handleDeleteVendor}
          onApprove={handleApproveVendor}
          onReject={handleRejectVendor}
          onStatusChange={(v) => {
            setStatusVendor(v);
            setStatusOpen(true);
          }}
        />
      )}

      {statusOpen && statusVendor && (
        <VendorStatusToggle
          key={statusVendor._id || statusVendor.id}
          vendor={statusVendor}
          open={statusOpen}
          loading={saving}
          onClose={() => {
            setStatusOpen(false);
            setStatusVendor(null);
          }}
          onConfirm={handleToggleStatus}
        />
      )}
    </div>
  );
};

export default Vendors;
