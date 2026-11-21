import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import UserFilters from "../../components/admin/users/UserFilters";
import UserTable from "../../components/admin/users/UserTable";
import UserDetails from "../../components/admin/users/UserDetails";
import UserStatusToggle from "../../components/admin/users/UserStatusToggle";
import AdminPagination from "../../components/admin/AdminPagination";

import {
  fetchAdminUsers,
  fetchAdminUserById,
  updateAdminUser,
  deleteAdminUser,
  toggleAdminUserStatus,
  clearSelectedUser,
  clearAdminUsersError,
  setAdminUsersPage,
  setAdminUsersLimit,
} from "../../store/slices/Admin/adminUsersSlice";

const initialFilters = {
  search: "",
  role: "all",
  status: "all",
  sortBy: "newest",
};

const isUserBlocked = (u) => Boolean(u?.isBlocked ?? u?.isActive === false);

const Users = () => {
  const dispatch = useDispatch();

  const {
    users,
    selectedUser,
    summary,
    pagination,
    loading,
    detailsLoading,
    saving,
    error,
  } = useSelector((state) => state.adminUsers);

  const [filters, setFilters] = useState(initialFilters);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [statusUser, setStatusUser] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [actionError, setActionError] = useState("");

  const { page = 1, limit = 10, total = 0, totalPages = 0 } = pagination;

  const buildQueryParams = (overrides = {}) => {
    const params = {
      page,
      limit,
      ...overrides,
    };

    if (filters.search.trim()) {
      params.search = filters.search.trim();
    }

    if (filters.role !== "all") {
      params.role = filters.role;
    }

    if (filters.status !== "all") {
      params.status = filters.status;
    }

    if (filters.sortBy !== "newest") {
      params.sortBy = filters.sortBy;
    }

    return params;
  };

  useEffect(() => {
    const timer = setTimeout(
      () => {
        dispatch(fetchAdminUsers(buildQueryParams()));
      },
      filters.search ? 350 : 0,
    );

    return () => clearTimeout(timer);
  }, [
    dispatch,
    page,
    limit,
    filters.search,
    filters.role,
    filters.status,
    filters.sortBy,
  ]);

  const handleFilterChange = (nextFilters) => {
    setFilters(nextFilters);
    dispatch(setAdminUsersPage(1));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    dispatch(setAdminUsersPage(1));
    dispatch(clearAdminUsersError());
    setActionError("");
  };

  const openUserDetails = async (user, shouldEdit = false) => {
    if (!user?._id) return;
    setActionError("");
    setEditMode(shouldEdit);
    setViewingUser(user);
    setDetailsOpen(true);

    try {
      const fresh = await dispatch(fetchAdminUserById(user._id)).unwrap();
      if (fresh) setViewingUser(fresh);
    } catch (errorMessage) {
      setActionError(
        typeof errorMessage === "string"
          ? errorMessage
          : "Unable to load user details.",
      );
    }
  };

  const handleViewUser = (user) => {
    openUserDetails(user, false);
  };

  const handleEditUser = (user) => {
    openUserDetails(user, true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setEditMode(false);
    setViewingUser(null);
    dispatch(clearSelectedUser());
  };

  const handleSaveUser = async (user, userData) => {
    if (!user?._id) return;

    setActionError("");

    try {
      const updated = await dispatch(
        updateAdminUser({
          userId: user._id,
          userData,
        }),
      ).unwrap();

      toast.success("User updated successfully");
      await dispatch(fetchAdminUsers(buildQueryParams())).unwrap();

      if (updated) {
        setViewingUser(updated);
      } else {
        const refreshed = await dispatch(fetchAdminUserById(user._id)).unwrap();
        if (refreshed) setViewingUser(refreshed);
      }

      setEditMode(false);
    } catch (errorMessage) {
      const msg =
        typeof errorMessage === "string" ? errorMessage : "Unable to update user.";
      setActionError(msg);
      toast.error(msg);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!user?._id || saving) return;

    const name =
      user.fullName || user.name || user.username || user.email || "this user";

    const confirmed = window.confirm(
      `Are you sure you want to delete ${name}?`,
    );

    if (!confirmed) return;

    setActionError("");

    try {
      await dispatch(deleteAdminUser(user._id)).unwrap();
      toast.success("User deleted successfully");

      if (detailsOpen) {
        handleCloseDetails();
      }

      const nextPage = users.length === 1 && page > 1 ? page - 1 : page;

      if (nextPage !== page) {
        dispatch(setAdminUsersPage(nextPage));
      } else {
        await dispatch(fetchAdminUsers(buildQueryParams())).unwrap();
      }
    } catch (errorMessage) {
      const msg =
        typeof errorMessage === "string" ? errorMessage : "Unable to delete user.";
      setActionError(msg);
      toast.error(msg);
    }
  };

  const handleStatusClick = (user) => {
    if (!user?._id) return;
    setStatusUser(user);
    setStatusOpen(true);
  };

  const handleCloseStatus = () => {
    setStatusOpen(false);
    setStatusUser(null);
  };

  const handleToggleUserStatus = async (user) => {
    if (!user?._id || saving) return;

    setActionError("");

    try {
      const updatedUser = await dispatch(toggleAdminUserStatus(user._id)).unwrap();
      const nowBlocked = isUserBlocked(updatedUser);
      toast.success(nowBlocked ? "User blocked" : "User unblocked");

      handleCloseStatus();

      if (selectedUser?._id === user._id || viewingUser?._id === user._id) {
        setViewingUser((prev) =>
          prev ? { ...prev, ...updatedUser } : updatedUser,
        );
      }

      await dispatch(fetchAdminUsers(buildQueryParams())).unwrap();

      if (detailsOpen && viewingUser?._id === user._id) {
        const refreshed = await dispatch(fetchAdminUserById(user._id)).unwrap();
        if (refreshed) setViewingUser(refreshed);
      }
    } catch (errorMessage) {
      const msg =
        typeof errorMessage === "string"
          ? errorMessage
          : "Unable to update user status.";
      setActionError(msg);
      toast.error(msg);
    }
  };

  const allUsersCount = summary?.totalUsers || total || users.length;
  const customersCount =
    summary?.customersCount ??
    users.filter((u) => {
      const r = String(u.role || "customer").toLowerCase();
      return r === "customer" || r === "user";
    }).length;
  const vendorsCount =
    summary?.vendorsCount ??
    users.filter((u) => String(u.role || "").toLowerCase() === "vendor").length;
  const blockedCount =
    summary?.blockedCount ?? users.filter(isUserBlocked).length;

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Users</h1>
        </div>
      </div>

      <div className="stats">
        {[
          ["All users", allUsersCount],
          ["Customers", customersCount],
          ["Vendors", vendorsCount],
          ["Blocked", blockedCount],
        ].map(([label, val]) => (
          <div key={label} className="stat">
            <span className="label">{label}</span>
            <strong>{Number(val).toLocaleString("en-IN")}</strong>
          </div>
        ))}
      </div>

      {(error || actionError) && (
        <div
          role="alert"
          className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] p-3 text-xs font-bold text-[var(--red)]"
        >
          <span>{actionError || error}</span>

          <button
            type="button"
            onClick={() => {
              setActionError("");
              dispatch(clearAdminUsersError());
            }}
            className="cursor-pointer font-black"
          >
            ×
          </button>
        </div>
      )}

      <div className="panel">
        <UserFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          loading={loading}
        />

        <UserTable
          users={users}
          loading={loading}
          onViewUser={handleViewUser}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onToggleStatus={handleStatusClick}
        />

        <AdminPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={limit}
          itemLabel="users"
          loading={loading}
          onPageChange={(nextPage) => dispatch(setAdminUsersPage(nextPage))}
          onPageSizeChange={(nextLimit) =>
            dispatch(setAdminUsersLimit(nextLimit))
          }
        />
      </div>

      <UserDetails
        user={viewingUser || selectedUser}
        open={detailsOpen}
        loading={detailsLoading && !viewingUser}
        saving={saving}
        editMode={editMode}
        onClose={handleCloseDetails}
        onEdit={() => setEditMode(true)}
        onSave={handleSaveUser}
        onDelete={handleDeleteUser}
        onToggleStatus={handleStatusClick}
      />

      <UserStatusToggle
        user={statusUser}
        open={statusOpen}
        loading={saving}
        onClose={handleCloseStatus}
        onConfirm={handleToggleUserStatus}
      />
    </div>
  );
};

export default Users;
