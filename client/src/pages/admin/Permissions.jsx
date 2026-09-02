import { useState } from "react";

import AdminHeader from "../../components/admin/AdminHeader";
import AdminSidebar from "../../components/admin/AdminSidebar";

import PermissionSettings from "../../components/admin/settings/PermissionSettings";

const Permissions = ({
  user = null,

  roles = [],
  permissions = [],
  permissionMatrix = {},

  loading = false,
  saving = false,

  notificationCount = 0,

  onSavePermissions,

  onLogout,
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
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
          <div className="mx-auto max-w-7xl">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Permissions
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage roles and access permissions for the admin panel.
              </p>
            </div>

            {/* Permission Settings */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
              <PermissionSettings
                roles={roles}
                permissions={permissions}
                matrix={permissionMatrix}
                loading={loading}
                saving={saving}
                onSave={onSavePermissions}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Permissions;
