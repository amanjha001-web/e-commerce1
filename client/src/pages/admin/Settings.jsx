import { useState } from "react";

import AdminHeader from "../../components/admin/AdminHeader";
import AdminSidebar from "../../components/admin/AdminSidebar";

import GeneralSettings from "../../components/admin/settings/GeneralSettings";
import SecuritySettings from "../../components/admin/settings/SecuritySettings";
import NotificationSettings from "../../components/admin/settings/NotificationSettings";
import PermissionSettings from "../../components/admin/settings/PermissionSettings";

const Settings = ({
  user = null,

  generalSettings = {},
  securitySettings = {},
  notificationSettings = {},

  roles = [],
  permissions = [],
  permissionMatrix = {},

  loading = false,
  saving = false,

  notificationCount = 0,

  onSaveGeneral,
  onSaveSecurity,
  onSaveNotifications,
  onSavePermissions,

  onLogout,
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    {
      id: "general",
      label: "General",
    },
    {
      id: "security",
      label: "Security",
    },
    {
      id: "notifications",
      label: "Notifications",
    },
    {
      id: "permissions",
      label: "Permissions",
    },
  ];

  const handleTabChange = (tabId) => {
    if (saving) return;
    setActiveTab(tabId);
  };

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
                Settings
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage application, security, notification and permission
                settings.
              </p>
            </div>

            {/* Tabs */}
            <div className="mb-6 overflow-x-auto border-b border-border">
              <div
                className="flex min-w-max gap-6"
                role="tablist"
                aria-label="Settings sections"
              >
                {tabs.map((tab) => {
                  const active = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-controls={`${tab.id}-settings-panel`}
                      onClick={() => handleTabChange(tab.id)}
                      disabled={saving}
                      className={[
                        "border-b-2 px-1 pb-3 pt-1 text-sm font-medium transition",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        active
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      ].join(" ")}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Settings Content */}
            <div
              id={`${activeTab}-settings-panel`}
              role="tabpanel"
              aria-labelledby={activeTab}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6"
            >
              {activeTab === "general" && (
                <GeneralSettings
                  key="general-settings"
                  settings={generalSettings}
                  loading={loading}
                  saving={saving}
                  onSave={onSaveGeneral}
                />
              )}

              {activeTab === "security" && (
                <SecuritySettings
                  key="security-settings"
                  settings={securitySettings}
                  loading={loading}
                  saving={saving}
                  onSave={onSaveSecurity}
                />
              )}

              {activeTab === "notifications" && (
                <NotificationSettings
                  key="notification-settings"
                  settings={notificationSettings}
                  loading={loading}
                  saving={saving}
                  onSave={onSaveNotifications}
                />
              )}

              {activeTab === "permissions" && (
                <PermissionSettings
                  key="permission-settings"
                  roles={roles}
                  permissions={permissions}
                  matrix={permissionMatrix}
                  loading={loading}
                  saving={saving}
                  onSave={onSavePermissions}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
