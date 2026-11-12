import { useMemo, useState } from "react";
import { toast } from "sonner";

const DEMO_REQUESTS = [
  {
    id: "req-1",
    applicant: "Aarav Mehta",
    business: "Northstar Store",
    submitted: "10 Nov 2026",
    documents: "Verified",
    status: "Pending",
    email: "northstar@email.com",
    phone: "+91 98765 43210",
    gstNumber: "27AABCN1234F1Z5",
    isDemo: true,
  },
  {
    id: "req-2",
    applicant: "Sana Khan",
    business: "Aura Essentials",
    submitted: "09 Nov 2026",
    documents: "Under review",
    status: "Pending",
    email: "aura@email.com",
    phone: "+91 98234 56789",
    gstNumber: "27AABCA5678F1Z2",
    isDemo: true,
  },
  {
    id: "req-3",
    applicant: "Dev Patel",
    business: "Urban Finds",
    submitted: "08 Nov 2026",
    documents: "Verified",
    status: "Pending",
    email: "urban@email.com",
    phone: "+91 98111 22334",
    gstNumber: "27AABCU9012F1Z9",
    isDemo: true,
  },
];

const getStatusClass = (s) =>
  s === "Delivered" ||
  s === "Active" ||
  s === "Resolved" ||
  s === "Published" ||
  s === "Approved"
    ? "green"
    : s === "Pending" || s === "Processing" || s === "Open"
      ? "amber"
      : s === "Blocked" || s === "Cancelled" || s === "Rejected"
        ? "red"
        : "";

const formatDate = (date) => {
  if (!date) return "10 Nov 2026";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const VendorRequests = ({
  requests = [],
  selectedRequest = null,
  saving = false,
  onViewRequest,
  onApproveRequest,
  onRejectRequest,
  onDeleteRequest,
  onCloseDetails,
}) => {
  const [localStatuses, setLocalStatuses] = useState({});
  const [viewingRow, setViewingRow] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const rows = useMemo(() => {
    const source = requests.length > 0 ? requests : DEMO_REQUESTS;
    return source.map((req, idx) => {
      const key = req._id || req.id || `req-${idx}`;
      const applicant =
        req.applicant ||
        req.ownerName ||
        req.fullName ||
        req.user?.fullName ||
        req.name ||
        "Applicant";
      const business =
        req.business ||
        req.shopName ||
        req.businessName ||
        req.storeName ||
        "Store";
      const submitted = req.submitted || formatDate(req.createdAt);
      const documents =
        req.documents && typeof req.documents === "string"
          ? req.documents
          : Array.isArray(req.documents) && req.documents.length > 0
            ? "Verified"
            : req.gstNumber || req.isVerified
              ? "Verified"
              : "Under review";

      const rawStatus =
        localStatuses[key] ||
        req.status ||
        (req.isApproved === true
          ? "Approved"
          : req.rejectionReason
            ? "Rejected"
            : "Pending");
      const normalizedStatus =
        String(rawStatus).charAt(0).toUpperCase() +
        String(rawStatus).slice(1).toLowerCase();

      return {
        ...req,
        _key: key,
        _applicant: applicant,
        _business: business,
        _submitted: submitted,
        _documents: documents,
        _status: normalizedStatus,
      };
    });
  }, [requests, localStatuses]);

  const handleAction = async (row, nextStatus, customReason) => {
    setLocalStatuses((prev) => ({
      ...prev,
      [row._key]: nextStatus,
    }));

    if (!row.isDemo && row._id) {
      try {
        if (nextStatus === "Approved") {
          await onApproveRequest?.(row);
          toast.success("Request approved");
        } else if (nextStatus === "Rejected") {
          await onRejectRequest?.(
            row,
            customReason || rejectReason || "Application rejected by admin",
          );
          toast.success("Request rejected");
        }
      } catch (err) {
        toast.error(err?.message || "Action failed");
      }
    } else {
      toast.success(`Request ${nextStatus.toLowerCase()}`);
    }
  };

  const handleOpenDetails = (row) => {
    setViewingRow(row);
    setRejectReason(row.rejectionReason || "");
    if (!row.isDemo && row._id) {
      onViewRequest?.(row);
    }
  };

  const activeDetail =
    selectedRequest && viewingRow && selectedRequest._id === viewingRow._id
      ? { ...viewingRow, ...selectedRequest }
      : viewingRow;

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Vendor requests</h1>
        </div>
      </div>

      <div className="panel">
        <h2>Pending applications</h2>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Business</th>
                <th>Submitted</th>
                <th>Documents</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._key}>
                  <td>
                    <button
                      type="button"
                      style={{
                        background: "none",
                        border: 0,
                        padding: 0,
                        color: "inherit",
                        font: "inherit",
                        fontWeight: 700,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                      onClick={() => handleOpenDetails(row)}
                    >
                      {row._applicant}
                    </button>
                  </td>
                  <td>{row._business}</td>
                  <td>{row._submitted}</td>
                  <td>{row._documents}</td>
                  <td>
                    {row._status === "Approved" || row._status === "Rejected" ? (
                      <span className={`status ${getStatusClass(row._status)}`}>
                        {row._status}
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btnsm primary"
                          disabled={saving}
                          onClick={() => handleAction(row, "Approved")}
                        >
                          Approve
                        </button>{" "}
                        <button
                          type="button"
                          className="btnsm"
                          disabled={saving}
                          onClick={() => handleAction(row, "Rejected")}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeDetail && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setViewingRow(null);
              onCloseDetails?.();
            }
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>{activeDetail._business}</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => {
                  setViewingRow(null);
                  onCloseDetails?.();
                }}
              >
                ✕
              </button>
            </div>
            <p>
              <b>Applicant:</b> {activeDetail._applicant}
            </p>
            <p>
              <b>Email:</b>{" "}
              {activeDetail.email || activeDetail.user?.email || "—"}
            </p>
            <p>
              <b>Phone:</b>{" "}
              {activeDetail.phone || activeDetail.user?.phone || "—"}
            </p>
            <p>
              <b>GST Number:</b> {activeDetail.gstNumber || "—"}
            </p>
            <p>
              <b>Submitted:</b> {activeDetail._submitted} · <b>Documents:</b>{" "}
              {activeDetail._documents}
            </p>
            <p>
              <b>Status:</b>{" "}
              <span
                className={`status ${getStatusClass(activeDetail._status)}`}
              >
                {activeDetail._status}
              </span>
            </p>

            <div className="formgroup" style={{ marginTop: "12px" }}>
              <label>Rejection / review note</label>
              <input
                className="field full"
                placeholder="Reason (minimum 5 characters for rejection)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
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
                className="btnsm primary"
                disabled={saving}
                onClick={async () => {
                  await handleAction(activeDetail, "Approved");
                  setViewingRow(null);
                  onCloseDetails?.();
                }}
              >
                Approve application
              </button>
              <button
                type="button"
                className="btnsm"
                disabled={saving}
                onClick={async () => {
                  await handleAction(
                    activeDetail,
                    "Rejected",
                    rejectReason || "Application rejected by admin",
                  );
                  setViewingRow(null);
                  onCloseDetails?.();
                }}
              >
                Reject application
              </button>
              {!activeDetail.isDemo && activeDetail._id && (
                <button
                  type="button"
                  className="btnsm"
                  disabled={saving}
                  onClick={async () => {
                    await onDeleteRequest?.(activeDetail);
                    toast.success("Vendor request deleted");
                    setViewingRow(null);
                    onCloseDetails?.();
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorRequests;
