import { useCallback, useEffect, useState } from "react";

import { Link } from "react-router-dom";

import vendorRequestService from "../../services/vendorRequest.service";

const statusConfig = {
  pending: {
    label: "Pending Review",
    description: "Your seller application is awaiting admin review.",
    icon: "⏳",
    badge: "status-badge status-badge-pending",
  },
  approved: {
    label: "Approved",
    description: "Your seller application has been approved.",
    icon: "✓",
    badge: "status-badge status-badge-delivered",
  },
  rejected: {
    label: "Rejected",
    description: "Your seller application was not approved.",
    icon: "!",
    badge: "status-badge status-badge-cancelled",
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
    <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</dt>
    <dd className="mt-1 break-words text-xs font-semibold text-[var(--text)] dark:text-foreground">
      {value || "Not provided"}
    </dd>
  </div>
);

const Section = ({ title, children }) => (
  <section className="panel mt-6 p-5 sm:p-7">
    <h2 className="mb-5 border-b border-[var(--line)] pb-3 text-sm font-black uppercase tracking-wider text-[var(--text)] dark:text-foreground dark:border-line">{title}</h2>
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
    <main className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)] transition-colors duration-300 sm:px-6 dark:bg-background dark:text-foreground">
      <div className="mx-auto max-w-4xl">
        <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
          <Link to="/" className="transition-colors hover:text-[var(--primary)]">
            Home
          </Link>
          <span>/</span>
          <Link
            to="/become-seller"
            className="transition-colors hover:text-[var(--primary)]"
          >
            Become a Seller
          </Link>
          <span>/</span>
          <span className="text-[var(--text)] dark:text-foreground font-bold">Request Status</span>
        </nav>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Application Status</span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-[var(--text)] dark:text-foreground">
              Seller Request Status
            </h1>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-[var(--muted)]">
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
            className="btnsm outlinebtn disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Status"}
          </button>
        </header>

        {loading ? (
          <div className="mt-8 panel animate-pulse p-8">
            <div className="h-6 w-52 rounded bg-black/5 dark:bg-white/5" />
            <div className="mt-4 h-4 w-72 max-w-full rounded bg-black/5 dark:bg-white/5" />
            <div className="mt-8 h-28 rounded-xl bg-black/5 dark:bg-white/5" />
          </div>
        ) : error || !application ? (
          <section className="panel mt-8 p-6 text-center shadow-sm sm:p-9">
            <div className="text-4xl">📄</div>

            <h2 className="mt-4 text-lg font-bold text-[var(--text)] dark:text-foreground">
              No Request Details Available
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-xs font-medium leading-relaxed text-[var(--muted)]">
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
                className="primarybtn"
              >
                Try Again
              </button>

              <Link
                to="/become-seller"
                className="outlinebtn"
              >
                Become a Seller
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="panel mt-8 p-5 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--primary)]/20 bg-[var(--soft)] text-2xl text-[var(--primary)]">
                    {config.icon}
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-[var(--text)] dark:text-foreground">
                      {application.shopName || application.businessName}
                    </h2>

                    <p className="mt-1 text-xs font-medium text-[var(--muted)]">
                      {application.businessName}
                    </p>

                    <span
                      className={`mt-3 inline-flex ${config.badge}`}
                    >
                      {config.label}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    Application ID
                  </p>
                  <p className="mt-1 break-all text-xs font-semibold text-[var(--text)] dark:text-foreground">
                    {application._id}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--soft)]/50 p-4 dark:border-line">
                <p className="text-xs font-semibold leading-relaxed text-[var(--text)] dark:text-foreground">
                  {config.description}
                </p>
              </div>

              <div className="mt-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)] dark:text-foreground">
                  Application Progress
                </h3>

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
                            className={`h-2 rounded-full transition-colors ${
                              completed ? "bg-[var(--primary)]" : "bg-black/10 dark:bg-white/10"
                            }`}
                          />
                          <p className="mt-2 text-[11px] font-semibold text-[var(--muted)]">
                            {step}
                          </p>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-5 border-t border-[var(--line)] pt-6 sm:grid-cols-2 dark:border-line">
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
            className="text-xs font-bold text-[var(--primary)] hover:underline dark:text-rose-400"
          >
            ← Back to ShopSphere Storefront
          </Link>
        </div>
      </div>
    </main>
  );
};

export default SellerRequestStatus;
