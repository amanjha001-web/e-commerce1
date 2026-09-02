import { useState } from "react";

import AdminHeader from "../../components/admin/AdminHeader";
import AdminSidebar from "../../components/admin/AdminSidebar";

import UserFilters from "../../components/admin/users/UserFilters";
import UserTable from "../../components/admin/users/UserTable";
import UserDetails from "../../components/admin/users/UserDetails";
import UserStatusToggle from "../../components/admin/users/UserStatusToggle";

const Users = ({
  user = null,

  users = [],
  totalUsers = 0,
  loading = false,
  saving = false,
  filters = {},

  notificationCount = 0,

  onFilterChange,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onToggleUserStatus,

  onLogout,
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [statusUser, setStatusUser] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const handleViewUser = (selected) => {
    setSelectedUser(selected);
    setDetailsOpen(true);

    onViewUser?.(selected);
  };

  const handleCloseDetails = () => {
    if (loading) return;

    setDetailsOpen(false);
    setSelectedUser(null);
  };

  const handleEditUser = (selected) => {
    onEditUser?.(selected);
  };

  const handleDeleteUser = async (selected) => {
    if (!onDeleteUser || saving) return;

    await onDeleteUser(selected);
  };

  const handleStatusClick = (selected) => {
    setStatusUser(selected);
    setStatusOpen(true);
  };

  const handleCloseStatus = () => {
    if (saving) return;

    setStatusOpen(false);
    setStatusUser(null);
  };

  const handleToggleStatus = async (selected, status) => {
    if (!onToggleUserStatus || saving) return;

    await onToggleUserStatus(selected, status);

    setStatusOpen(false);
    setStatusUser(null);
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
                Users
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage registered users, account status and user information.
              </p>
            </div>

            {/* Filters */}
            <div className="mb-6">
              <UserFilters filters={filters} onChange={onFilterChange} />
            </div>

            {/* User Count */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>

                <p className="text-2xl font-semibold">
                  {totalUsers || users.length}
                </p>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <UserTable
                users={users}
                loading={loading}
                onView={handleViewUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onToggleStatus={handleStatusClick}
              />
            </div>
          </div>
        </main>
      </div>

      {/* User Details Modal */}
      {detailsOpen && selectedUser && (
        <UserDetails
          key={selectedUser?._id || selectedUser?.id || "user-details"}
          user={selectedUser}
          open={detailsOpen}
          loading={loading}
          onClose={handleCloseDetails}
          onEdit={handleEditUser}
          onToggleStatus={handleStatusClick}
        />
      )}

      {/* User Status Modal */}
      {statusOpen && statusUser && (
        <UserStatusToggle
          key={statusUser?._id || statusUser?.id || "user-status"}
          user={statusUser}
          open={statusOpen}
          loading={saving}
          onClose={handleCloseStatus}
          onConfirm={handleToggleStatus}
        />
      )}
    </div>
  );
};

export default Users;
