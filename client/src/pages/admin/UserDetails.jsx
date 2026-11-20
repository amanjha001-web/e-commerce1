import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import UserDetailsCard from "../../components/admin/users/UserDetails";
import UserStatusToggle from "../../components/admin/users/UserStatusToggle";
import {
  fetchAdminUserById,
  updateAdminUser,
  toggleAdminUserStatus,
  deleteAdminUser,
} from "../../store/slices/Admin/adminUsersSlice";

const UserDetails = ({
  user: propUser = null,
  loading: propLoading = false,
  saving: propSaving = false,

  onBack,
  onEdit,
  onToggleStatus,
  onDelete,

  onNavigate,
}) => {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    selectedUser,
    detailsLoading,
    saving: storeSaving,
  } = useSelector((state) => state.adminUsers || {});

  const [editMode, setEditMode] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const isControlled = propUser !== null;
  const user = isControlled ? propUser : selectedUser;
  const loading = propLoading || detailsLoading;
  const saving = propSaving || storeSaving;

  useEffect(() => {
    if (!isControlled && userId) {
      dispatch(fetchAdminUserById(userId));
    }
  }, [isControlled, userId, dispatch]);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (onNavigate) {
      onNavigate("/admin/users");
      return;
    }
    navigate("/admin/users");
  };

  const handleSave = async (targetUser, userData) => {
    try {
      await dispatch(
        updateAdminUser({ userId: targetUser._id, userData }),
      ).unwrap();
      toast.success("User updated successfully");
      setEditMode(false);
      await dispatch(fetchAdminUserById(targetUser._id));
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to update user");
    }
  };

  const handleConfirmToggle = async (targetUser) => {
    if (onToggleStatus) {
      onToggleStatus(targetUser);
      setStatusOpen(false);
      return;
    }

    try {
      const updated = await dispatch(toggleAdminUserStatus(targetUser._id)).unwrap();
      const nowBlocked = Boolean(updated?.isBlocked ?? updated?.isActive === false);
      toast.success(nowBlocked ? "User blocked" : "User unblocked");
      setStatusOpen(false);
      await dispatch(fetchAdminUserById(targetUser._id));
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to update status");
    }
  };

  const handleDelete = async (targetUser) => {
    if (onDelete) {
      onDelete(targetUser);
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${
        targetUser.fullName || targetUser.email || "this user"
      }?`,
    );
    if (!confirmed) return;

    try {
      await dispatch(deleteAdminUser(targetUser._id)).unwrap();
      toast.success("User deleted");
      handleBack();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to delete user");
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[var(--bg)] p-4 text-[var(--text)] sm:p-6">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-8 w-48 rounded-lg bg-[var(--soft)]" />
          <div className="h-48 rounded-2xl bg-[var(--soft)]" />
          <div className="h-64 rounded-2xl bg-[var(--soft)]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg)] p-4 text-[var(--text)] sm:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="panel p-8 text-center">
            <h1 className="text-xl font-bold">User not found</h1>
            <p className="mt-2 text-xs text-[var(--muted)]">
              The requested user could not be found.
            </p>
            <button
              type="button"
              onClick={handleBack}
              className="primarybtn mt-6 cursor-pointer"
            >
              Back to Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="mb-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
          >
            ← Back to Users
          </button>
          <div className="eyebrow">ShopSphere administration</div>
          <h1 className="text-2xl font-black tracking-tight">User Details</h1>
        </div>
      </div>

      <UserDetailsCard
        key={user._id || user.id || "user-details"}
        user={user}
        inline
        open
        editMode={editMode}
        loading={loading}
        saving={saving}
        onClose={() => setEditMode(false)}
        onEdit={(u) => (onEdit ? onEdit(u) : setEditMode(true))}
        onSave={handleSave}
        onToggleStatus={() => setStatusOpen(true)}
        onDelete={handleDelete}
      />

      <UserStatusToggle
        user={user}
        open={statusOpen}
        loading={saving}
        onClose={() => setStatusOpen(false)}
        onConfirm={handleConfirmToggle}
      />
    </div>
  );
};

export default UserDetails;
