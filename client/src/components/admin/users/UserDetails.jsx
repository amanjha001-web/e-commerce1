import { useEffect, useState } from "react";

const UserDetails = ({
  user = null,
  open = false,
  loading = false,
  onClose,
  onEdit,
  onToggleStatus,
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (open) {
      setActiveTab("overview");
    }
  }, [open, user]);

  if (!open) return null;

  const userName =
    user?.fullName || user?.name || user?.username || "Unknown User";

  const email = user?.email || "-";

  const role = user?.role
    ? user.role
        .toString()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "User";

  const status =
    user?.status || (user?.isActive === false ? "inactive" : "active");

  const avatar = user?.avatar || user?.profileImage || user?.image || null;

  const getInitials = () => {
    return userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = () => {
    const statusMap = {
      active:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      inactive: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
      blocked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      suspended:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    };

    return statusMap[status?.toLowerCase()] || "bg-muted text-muted-foreground";
  };

  const formatStatus = () => {
    return status
      .toString()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={handleBackdropClick}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-details-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2
              id="user-details-title"
              className="text-lg font-semibold text-foreground"
            >
              User Details
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              View account information and activity
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto">
          {/* Profile */}
          <div className="border-b border-border px-5 py-6 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={userName}
                    className="h-16 w-16 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                    {getInitials()}
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-foreground">
                    {userName}
                  </h3>

                  <p className="truncate text-sm text-muted-foreground">
                    {email}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
                      {role}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass()}`}
                    >
                      {formatStatus()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onEdit?.(user)}
                  disabled={loading}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => onToggleStatus?.(user)}
                  disabled={loading}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
                >
                  {status?.toLowerCase() === "active" ? "Block" : "Activate"}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border px-5 sm:px-6">
            <div className="flex gap-6 overflow-x-auto">
              {[
                {
                  id: "overview",
                  label: "Overview",
                },
                {
                  id: "activity",
                  label: "Activity",
                },
                {
                  id: "orders",
                  label: "Orders",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative whitespace-nowrap py-3 text-sm font-medium transition ${
                    activeTab === tab.id
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}

                  {activeTab === tab.id && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-5 sm:p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Account Information */}
                <section>
                  <h3 className="mb-4 text-sm font-semibold text-foreground">
                    Account Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">Full Name</p>

                      <p className="mt-1 text-sm font-medium text-foreground">
                        {user?.fullName || user?.name || "-"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">Username</p>

                      <p className="mt-1 text-sm font-medium text-foreground">
                        {user?.username ? `@${user.username}` : "-"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">Email</p>

                      <p className="mt-1 break-all text-sm font-medium text-foreground">
                        {email}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">Phone</p>

                      <p className="mt-1 text-sm font-medium text-foreground">
                        {user?.phone || user?.phoneNumber || "-"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">Role</p>

                      <p className="mt-1 text-sm font-medium text-foreground">
                        {role}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">User ID</p>

                      <p className="mt-1 break-all text-sm font-medium text-foreground">
                        {user?._id || user?.id || "-"}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Dates */}
                <section>
                  <h3 className="mb-4 text-sm font-semibold text-foreground">
                    Account Dates
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">Joined</p>

                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatDate(user?.createdAt)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">
                        Last Updated
                      </p>

                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatDate(user?.updatedAt)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">
                        Last Login
                      </p>

                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatDateTime(user?.lastLoginAt || user?.lastLogin)}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Address */}
                {(user?.address || user?.addresses?.length) && (
                  <section>
                    <h3 className="mb-4 text-sm font-semibold text-foreground">
                      Address
                    </h3>

                    <div className="rounded-xl border border-border p-4 text-sm text-foreground">
                      {typeof user.address === "string" ? (
                        user.address
                      ) : (
                        <div className="space-y-1">
                          <p>
                            {user.address?.street ||
                              user.address?.addressLine1 ||
                              ""}
                          </p>

                          <p>
                            {user.address?.city || ""}
                            {user.address?.state
                              ? `, ${user.address.state}`
                              : ""}
                          </p>

                          <p>
                            {user.address?.postalCode ||
                              user.address?.zipCode ||
                              ""}
                          </p>

                          <p>{user.address?.country || ""}</p>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-3">
                {(user?.activity || []).length ? (
                  user.activity.map((item, index) => (
                    <div
                      key={item?._id || index}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {item?.title || item?.action || "User activity"}
                          </p>

                          {item?.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatDateTime(item?.createdAt || item?.date)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-border px-6 py-12 text-center">
                    <p className="text-sm font-medium text-foreground">
                      No activity available
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      User activity will appear here when available.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "orders" && (
              <div className="space-y-3">
                {(user?.orders || []).length ? (
                  user.orders.map((order, index) => (
                    <div
                      key={order?._id || index}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          #
                          {order?.orderNumber ||
                            order?.orderId ||
                            order?._id ||
                            index + 1}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(order?.createdAt)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          ₹
                          {Number(
                            order?.totalAmount || order?.total || 0,
                          ).toLocaleString("en-IN")}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {order?.status || "Unknown"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-border px-6 py-12 text-center">
                    <p className="text-sm font-medium text-foreground">
                      No orders available
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Orders placed by this user will appear here.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-border px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
