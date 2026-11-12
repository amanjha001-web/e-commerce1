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
  const [viewingUser, setViewingUser] = useState(null);
  const [statusUser, setStatusUser] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [actionError, setActionError] = useState("");

  const { page = 1, limit = 10, total = 0, totalPages = 0 } = pagination;

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
    setActionError("");
    setEditMode(false);
    setViewingUser(user);
    setDetailsOpen(true);

    dispatch(fetchAdminUserById(user._id))
      .unwrap()
      .then((freshUser) => {
        if (freshUser) {
          setViewingUser(freshUser);
        }
      })
      .catch((errorMessage) => {
        setActionError(
          typeof errorMessage === "string"
            ? errorMessage
            : "Unable to load user details.",
        );
      });
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
      const updated = await dispatch(fetchAdminUserById(user._id)).unwrap();
      if (updated) {
        setViewingUser(updated);
      }

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

      if (detailsOpen) {
        handleCloseDetails();
      }

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

      if (selectedUser?._id === user._id || viewingUser?._id === user._id) {
        const refreshed = await dispatch(fetchAdminUserById(user._id)).unwrap();
        if (refreshed) {
          setViewingUser(refreshed);
        }
      }
    } catch (errorMessage) {
      setActionError(
        typeof errorMessage === "string"
          ? errorMessage
          : "Unable to update user status.",
      );
    }
  };

  const customersCount = users.filter(
    (u) => !u.role || String(u.role).toLowerCase() === "customer",
  ).length;
  const vendorsCount = users.filter(
    (u) => String(u.role || "").toLowerCase() === "vendor",
  ).length;
  const blockedCount = users.filter((u) => Boolean(u.isBlocked)).length;

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
          ["All users", total || users.length],
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

        {totalPages > 1 && (
          <div className="mt-4 flex flex-col gap-3 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-[var(--muted)]">
              Page {page} of {Math.max(totalPages, 1)} · {total} users
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => dispatch(setAdminUsersPage(page - 1))}
                className="btnsm disabled:cursor-not-allowed disabled:opacity-40"
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
                className="btnsm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <UserDetails
        user={viewingUser || selectedUser}
        open={detailsOpen}
        loading={detailsLoading}
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
