import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import notificationService from "../../services/notification.service";
import {
  clearNotifications as clearNotificationsAction,
  markAllAsRead as markAllAsReadAction,
  markAsRead as markAsReadAction,
  removeNotification as removeNotificationAction,
  setNotifications,
} from "../../store/slices/notificationSlice";
import { toast } from "sonner";

import NotificationList from "../../components/notification/NotificationList";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import CustomerWorkspace from "../../components/layout/CustomerWorkspace";

const extractNotificationId = (target) => {
  if (!target) return "";
  if (typeof target === "string" || typeof target === "number") {
    return String(target);
  }
  return target._id || target.id || "";
};

const extractNotificationsList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data?.notifications)) return res.data.notifications;
  if (Array.isArray(res?.notifications)) return res.notifications;
  if (Array.isArray(res?.data?.data?.notifications)) return res.data.data.notifications;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

const getIsRead = (notification) =>
  Boolean(notification?.read ?? notification?.isRead ?? false);

const Notifications = ({
  notifications: propNotifications,
  loading: propLoading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onNavigate,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [internalNotifications, setInternalNotifications] = useState([]);
  const [internalLoading, setInternalLoading] = useState(!propNotifications?.length);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const hasPropNotifications = Array.isArray(propNotifications) && propNotifications.length > 0;
  const notifications = hasPropNotifications ? propNotifications : internalNotifications;
  const loading = hasPropNotifications ? propLoading : internalLoading;

  const loadNotifications = useCallback(async () => {
    try {
      setInternalLoading(true);
      setFetchError("");
      const res = await notificationService.getNotifications({ limit: 50 });
      const list = extractNotificationsList(res);
      setInternalNotifications(list);
      dispatch(setNotifications(list));
    } catch (err) {
      console.error("Failed to load customer notifications:", err);
      setFetchError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load notifications right now.",
      );
      setInternalNotifications([]);
    } finally {
      setInternalLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!propNotifications || propNotifications.length === 0) {
      loadNotifications();
    } else {
      setInternalLoading(false);
    }
  }, [propNotifications?.length, loadNotifications]);

  const handleMarkAsRead = async (target) => {
    const id = extractNotificationId(target);
    if (!id) return;

    if (onMarkAsRead) return onMarkAsRead(id);
    try {
      await notificationService.markAsRead(id);
      setInternalNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id) === id ? { ...n, isRead: true, read: true } : n,
        ),
      );
      dispatch(markAsReadAction(id));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (onMarkAllAsRead) return onMarkAllAsRead();
    try {
      await notificationService.markAllAsRead();
      setInternalNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true })),
      );
      dispatch(markAllAsReadAction());
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to mark all as read");
    }
  };

  const handleDelete = async (target) => {
    const id = extractNotificationId(target);
    if (!id) return;

    if (onDeleteNotification) return onDeleteNotification(id);
    try {
      await notificationService.deleteNotification(id);
      setInternalNotifications((prev) =>
        prev.filter((n) => (n._id || n.id) !== id),
      );
      dispatch(removeNotificationAction(id));
      toast.success("Notification removed");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove notification");
    }
  };

  const handleClear = async () => {
    if (onClearAll) return onClearAll();
    try {
      await notificationService.clearNotifications();
      setInternalNotifications([]);
      dispatch(clearNotificationsAction());
      toast.success("All notifications cleared");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to clear notifications");
    }
  };

  const handleNotificationClick = async (notification) => {
    const id = extractNotificationId(notification);
    if (id && !getIsRead(notification)) {
      await handleMarkAsRead(id);
    }
    const targetLink = notification?.link || notification?.data?.link;
    if (targetLink) {
      if (onNavigate) {
        onNavigate(targetLink);
      } else {
        navigate(targetLink);
      }
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !getIsRead(notification),
  ).length;
  const readCount = Math.max(0, notifications.length - unreadCount);

  const filteredNotifications = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const isRead = getIsRead(notification);

      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !isRead) ||
        (filter === "read" && isRead);

      if (!matchesFilter) return false;

      if (!keyword) return true;

      return (
        notification?.title?.toLowerCase().includes(keyword) ||
        notification?.message?.toLowerCase().includes(keyword) ||
        notification?.description?.toLowerCase().includes(keyword) ||
        notification?.type?.toLowerCase().includes(keyword)
      );
    });
  }, [notifications, search, filter]);

  return (
    <CustomerWorkspace
      title="Notifications"
      eyebrow="Customer workspace"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadNotifications}
            disabled={loading}
            className="outlinebtn !py-2 !px-3 !text-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="btnsm cursor-pointer"
            >
              ✓ Mark all read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-xl border border-red-200 bg-red-50/50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 cursor-pointer dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
            >
              Clear all
            </button>
          )}
        </div>
      }
    >
      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Total
          </span>
          <strong className="mt-1 block text-2xl font-black text-[var(--text)] dark:text-foreground">
            {notifications.length}
          </strong>
        </div>

        <div className="stat-card">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Unread
          </span>
          <strong className="mt-1 block text-2xl font-black text-[var(--primary)]">
            {unreadCount}
          </strong>
        </div>

        <div className="stat-card">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Read
          </span>
          <strong className="mt-1 block text-2xl font-black text-[#16845b]">
            {readCount}
          </strong>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mb-6 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-xs dark:bg-card dark:border-line">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications..."
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-medium text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card dark:text-foreground"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All", count: notifications.length },
              { key: "unread", label: "Unread", count: unreadCount },
              { key: "read", label: "Read", count: readCount },
            ].map((tab) => {
              const isActive = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--primary)] hover:bg-[var(--soft)] hover:text-[var(--primary)] dark:bg-card"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[var(--soft)] text-[var(--primary)]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notifications List Container */}
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:bg-card dark:border-line">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader />
          </div>
        ) : fetchError ? (
          <div className="p-10 text-center">
            <EmptyState
              title="Unable to load notifications"
              message={fetchError}
              action={loadNotifications}
              actionText="Try Again"
            />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-10 text-center">
            <EmptyState
              title="No notifications"
              message={
                search.trim()
                  ? "No notifications match your search."
                  : "You have no notifications in this category."
              }
            />
          </div>
        ) : (
          <NotificationList
            notifications={filteredNotifications}
            onRead={handleMarkAsRead}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
            onItemClick={handleNotificationClick}
            maxHeightClass=""
          />
        )}
      </div>
    </CustomerWorkspace>
  );
};

export default Notifications;
