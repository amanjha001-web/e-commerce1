import { useState } from "react";

import AdminHeader from "../../components/admin/AdminHeader";
import AdminSidebar from "../../components/admin/AdminSidebar";
import UserDetailsCard from "../../components/admin/users/UserDetails";

const UserDetails = ({
  user = null,
  loading = false,
  saving = false,
  notificationCount = 0,

  onBack,
  onEdit,
  onToggleStatus,
  onDelete,

  onLogout,
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    onNavigate?.("/admin/users");
  };

  const renderLayout = (content) => (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader
        user={user}
        notificationCount={notificationCount}
        onMenuClick={() => setSidebarOpen(true)}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <div className="flex">
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{content}</div>
        </main>
      </div>
    </div>
  );

  if (loading) {
    return renderLayout(
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-48 rounded-2xl bg-muted" />
        <div className="h-64 rounded-2xl bg-muted" />
      </div>,
    );
  }

  if (!user) {
    return renderLayout(
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold">User not found</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          The requested user could not be found.
        </p>

        <button
          type="button"
          onClick={handleBack}
          className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Back to Users
        </button>
      </div>,
    );
  }

  return renderLayout(
    <>
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <span aria-hidden="true">←</span>
            Back to Users
          </button>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            User Details
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            View and manage complete user information.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(user)}
              disabled={saving}
              className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Edit User
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(user)}
              disabled={saving}
              className="rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* User Details */}
      <UserDetailsCard
        key={user?._id || user?.id || "user-details"}
        user={user}
        open
        loading={loading}
        onClose={handleBack}
        onEdit={onEdit}
        onToggleStatus={onToggleStatus}
      />
    </>,
  );
};

export default UserDetails;
