import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import UserFilters from "../../components/admin/users/UserFilters";
import UserTable from "../../components/admin/users/UserTable";
import UserDetails from "../../components/admin/users/UserDetails";
import UserStatusToggle from "../../components/admin/users/UserStatusToggle";

import {
  fetchAdminUsers,
  fetchAdminUserById,
  updateAdminUser,
  deleteAdminUser,
  toggleAdminUserStatus,
  clearSelectedUser,
  clearAdminUsersError,
  setAdminUsersPage,
} from "../../store/slices/Admin/adminUsersSlice";

const initialFilters = {
  search: "",
  role: "all",
  status: "all",
  sortBy: "newest",
};

const Users = () => {
  const dispatch = useDispatch();

  const {
    users,
    selectedUser,
    pagination,
    loading,
    detailsLoading,
    saving,
    error,
  } = useSelector((state) => state.adminUsers);

  const [filters, setFilters] = useState(initialFilters);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [statusUser, setStatusUser] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [actionError, setActionError] = useState("");

  const { page = 1, limit = 10, total = 0, totalPages = 0 } = pagination;

  // Fetch users; debounce text search.
  useEffect(() => {
    const timer = setTimeout(
      () => {
        const params = {
          page,
          limit,
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

        dispatch(fetchAdminUsers(params));
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
    setActionError("");
    setEditMode(shouldEdit);
    setDetailsOpen(true);

    try {
      await dispatch(fetchAdminUserById(user._id)).unwrap();
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
    dispatch(clearSelectedUser());
  };

  const getCurrentParams = () => {
    const params = { page, limit };

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

  const handleSaveUser = async (user, userData) => {
    if (!user?._id) return;

    setActionError("");

    try {
      await dispatch(
        updateAdminUser({
          userId: user._id,
          userData,
        }),
      ).unwrap();

      await dispatch(fetchAdminUsers(getCurrentParams())).unwrap();
      await dispatch(fetchAdminUserById(user._id)).unwrap();

      setEditMode(false);
    } catch (errorMessage) {
      setActionError(
        typeof errorMessage === "string"
          ? errorMessage
          : "Unable to update user.",
      );
    }
  };

  const handleDeleteUser = async (user) => {
    if (!user?._id || saving) return;

    const name = user.fullName || user.username || user.email || "this user";

    const confirmed = window.confirm(
      `Are you sure you want to delete ${name}?`,
    );

    if (!confirmed) return;

    setActionError("");

    try {
      await dispatch(deleteAdminUser(user._id)).unwrap();

      // Refetch after deletion so pagination totals remain accurate.
      const nextPage = users.length === 1 && page > 1 ? page - 1 : page;

      if (nextPage !== page) {
        dispatch(setAdminUsersPage(nextPage));
      } else {
        await dispatch(fetchAdminUsers(getCurrentParams())).unwrap();
      }
    } catch (errorMessage) {
      setActionError(
        typeof errorMessage === "string"
          ? errorMessage
          : "Unable to delete user.",
      );
    }
  };

  const handleStatusClick = (user) => {
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
      await dispatch(toggleAdminUserStatus(user._id)).unwrap();

      handleCloseStatus();

      await dispatch(fetchAdminUsers(getCurrentParams())).unwrap();

      if (selectedUser?._id === user._id) {
        await dispatch(fetchAdminUserById(user._id)).unwrap();
      }
    } catch (errorMessage) {
      setActionError(
        typeof errorMessage === "string"
          ? errorMessage
          : "Unable to update user status.",
      );
    }
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Users
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage customer, vendor and admin accounts.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-950">
          <p className="text-xs text-gray-500">Total users</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">
            {total}
          </p>
        </div>
      </div>

      {(error || actionError) && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <span>{actionError || error}</span>

          <button
            type="button"
            onClick={() => {
              setActionError("");
              dispatch(clearAdminUsersError());
            }}
            className="font-semibold"
          >
            ×
          </button>
        </div>
      )}

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          Page {page} of {Math.max(totalPages, 1)} · {total} users
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => dispatch(setAdminUsersPage(page - 1))}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700"
          >
            Previous
          </button>

          <button
            type="button"
            disabled={
              loading ||
              (totalPages > 0 && page >= totalPages) ||
              totalPages === 0
            }
            onClick={() => dispatch(setAdminUsersPage(page + 1))}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700"
          >
            Next
          </button>
        </div>
      </div>

      <UserDetails
        user={selectedUser}
        open={detailsOpen}
        loading={detailsLoading}
        saving={saving}
        editMode={editMode}
        onClose={handleCloseDetails}
        onEdit={() => setEditMode(true)}
        onSave={handleSaveUser}
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
