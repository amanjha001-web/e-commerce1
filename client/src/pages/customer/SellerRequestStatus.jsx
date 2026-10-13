import { useCallback, useEffect, useState } from "react";

import { Link } from "react-router-dom";

import vendorRequestService from "../../services/vendorRequest.service";

const statusConfig = {
  pending: {
    label: "Pending Review",
    description: "Your seller application is awaiting admin review.",
    icon: "⏳",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  approved: {
    label: "Approved",
    description: "Your seller application has been approved.",
    icon: "✓",
    badge: "border-green-500/30 bg-green-500/10 text-green-300",
  },
  rejected: {
    label: "Rejected",
    description: "Your seller application was not approved.",
    icon: "!",
    badge: "border-red-500/30 bg-red-500/10 text-red-300",
  },
};

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const Detail = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="text-xs text-slate-400">{label}</dt>
    <dd className="mt-1 break-words text-sm font-medium text-white">
      {value || "Not provided"}
    </dd>
  </div>
);

const Section = ({ title, children }) => (
  <section className="mt-6 rounded-2xl border border-slate-800 bg-[#0e1422] p-5 sm:p-7">
    <h2 className="mb-5 text-lg font-semibold text-white">{title}</h2>
    <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">{children}</dl>
  </section>
);

const SellerRequestStatus = () => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequest = useCallback(async () => {
    try {
      setError("");

      const response = await vendorRequestService.getMyRequest();
      const request = response?.data;

      if (!request?._id) {
        setApplication(null);
        setError("No vendor application was found for your account.");
        return;
      }

      setApplication(request);
    } catch (err) {
      setApplication(null);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load your seller application.",
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadInitialRequest = async () => {
      try {
        const response = await vendorRequestService.getMyRequest();
        const request = response?.data;

        if (cancelled) return;

        if (!request?._id) {
          setApplication(null);
          setError("No vendor application was found for your account.");
          return;
        }

        setApplication(request);
        setError("");
      } catch (err) {
        if (cancelled) return;

        setApplication(null);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load your seller application.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadInitialRequest();

    return () => {
      cancelled = true;
    };
  }, []);

  const status = application?.status?.toLowerCase() || "pending";
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <main className="min-h-screen bg-[#070b14] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <nav className="mb-6 text-sm text-slate-400">
          <Link to="/" className="hover:text-blue-400">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/become-seller" className="hover:text-blue-400">
            Become a Seller
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white">Request Status</span>
        </nav>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Seller Request Status
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Track the review progress of your seller application.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              try {
                await loadRequest();
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Status"}
          </button>
        </header>

        {loading ? (
          <div className="mt-8 animate-pulse rounded-2xl border border-slate-800 bg-[#0e1422] p-8">
            <div className="h-6 w-52 rounded bg-slate-700" />
            <div className="mt-4 h-4 w-72 max-w-full rounded bg-slate-800" />
            <div className="mt-8 h-28 rounded-xl bg-slate-800" />
          </div>
        ) : error || !application ? (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-[#0e1422] p-6 text-center sm:p-9">
            <div className="text-4xl">📄</div>

            <h2 className="mt-4 text-xl font-semibold">
              No Request Details Available
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">
              {error ||
                "We couldn't find a seller application for your account."}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await loadRequest();
                  } finally {
                    setLoading(false);
                  }
                }}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold hover:opacity-90"
              >
                Try Again
              </button>

              <Link
                to="/become-seller"
                className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              >
                Become a Seller
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="mt-8 rounded-2xl border border-slate-800 bg-[#0e1422] p-5 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#070b14] text-2xl">
                    {config.icon}
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold">
                      {application.shopName || application.businessName}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      {application.businessName}
                    </p>

                    <span
                      className={`mt-3 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${config.badge}`}
                    >
                      {config.label}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs text-slate-400">Application ID</p>
                  <p className="mt-1 break-all text-xs text-slate-300">
                    {application._id}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-slate-800 bg-[#070b14] p-4">
                <p className="text-sm leading-6 text-slate-300">
                  {config.description}
                </p>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-semibold">Application Progress</h3>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {["Submitted", "Under Review", "Decision"].map(
                    (step, index) => {
                      const completed =
                        index === 0 ||
                        (index === 1 &&
                          ["pending", "approved", "rejected"].includes(
                            status,
                          )) ||
                        (index === 2 &&
                          ["approved", "rejected"].includes(status));

                      return (
                        <div key={step}>
                          <div
                            className={`h-1.5 rounded-full ${
                              completed ? "bg-blue-500" : "bg-slate-700"
                            }`}
                          />
                          <p className="mt-2 text-xs text-slate-400">{step}</p>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-5 border-t border-slate-800 pt-6 sm:grid-cols-2">
                <Detail
                  label="Submitted On"
                  value={formatDate(application.createdAt)}
                />
                <Detail
                  label="Last Updated"
                  value={formatDate(application.updatedAt)}
                />
                {application.reviewedAt && (
                  <Detail
                    label="Reviewed On"
                    value={formatDate(application.reviewedAt)}
                  />
                )}
              </div>
            </section>

            <Section title="Business Information">
              <Detail label="Shop Name" value={application.shopName} />
              <Detail label="Business Name" value={application.businessName} />
              <Detail label="Email" value={application.email} />
              <Detail label="Phone" value={application.phone} />
              <Detail label="Website" value={application.website} />
              <div className="sm:col-span-2">
                <Detail label="Description" value={application.description} />
              </div>
            </Section>

            <Section title="Business Address">
              <Detail
                label="Address Line 1"
                value={application.address?.addressLine1}
              />
              <Detail
                label="Address Line 2"
                value={application.address?.addressLine2}
              />
              <Detail label="City" value={application.address?.city} />
              <Detail label="State" value={application.address?.state} />
              <Detail
                label="Postal Code"
                value={application.address?.postalCode}
              />
              <Detail label="Country" value={application.address?.country} />
            </Section>

            <Section title="Bank Details">
              <Detail
                label="Account Holder"
                value={application.bankDetails?.accountHolderName}
              />
              <Detail
                label="Account Number"
                value={
                  application.bankDetails?.accountNumber
                    ? `•••• •••• ${String(
                        application.bankDetails.accountNumber,
                      ).slice(-4)}`
                    : "Not provided"
                }
              />
              <Detail
                label="Bank Name"
                value={application.bankDetails?.bankName}
              />
              <Detail
                label="Branch Name"
                value={application.bankDetails?.branchName}
              />
              <Detail
                label="IFSC Code"
                value={application.bankDetails?.ifscCode}
              />
              <Detail label="UPI ID" value={application.bankDetails?.upiId} />
            </Section>
          </>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            ← Back to ShopSphere
          </Link>
        </div>
      </div>
    </main>
  );
};

export default SellerRequestStatus;
