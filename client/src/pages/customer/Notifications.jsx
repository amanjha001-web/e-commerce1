import { useEffect, useMemo, useState } from "react";
import notificationService from "../../services/notification.service";
import { toast } from "sonner";

import NotificationList from "../../components/notification/NotificationList";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import CustomerWorkspace from "../../components/layout/CustomerWorkspace";

const Notifications = ({
  notifications: propNotifications = [],
  loading: propLoading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onNavigate,
}) => {
  const [internalNotifications, setInternalNotifications] = useState([]);
  const [internalLoading, setInternalLoading] = useState(!propNotifications?.length);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const notifications = propNotifications?.length > 0 ? propNotifications : internalNotifications;
  const loading = propNotifications?.length > 0 ? propLoading : internalLoading;

  const loadNotifications = async () => {
    try {
      setInternalLoading(true);
      const res = await notificationService.getNotifications();
      const list = res?.data?.notifications || res?.data || res?.notifications || [];
      setInternalNotifications(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load customer notifications:", err);
    } finally {
      setInternalLoading(false);
    }
  };

  useEffect(() => {
    if (!propNotifications || propNotifications.length === 0) {
      loadNotifications();
    }
  }, [propNotifications]);

  const handleMarkAsRead = async (id) => {
    if (onMarkAsRead) return onMarkAsRead(id);
    try {
      await notificationService.markAsRead(id);
      setInternalNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true, read: true } : n))
      );
    } catch (err) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (onMarkAllAsRead) return onMarkAllAsRead();
    try {
      await notificationService.markAllAsRead();
      toast.success("All notifications marked as read");
      await loadNotifications();
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (id) => {
    if (onDeleteNotification) return onDeleteNotification(id);
    try {
      await notificationService.deleteNotification(id);
      toast.success("Notification removed");
      await loadNotifications();
    } catch (err) {
      toast.error("Failed to remove notification");
    }
  };

  const handleClear = async () => {
    if (onClearAll) return onClearAll();
    try {
      await notificationService.clearNotifications();
      toast.success("All notifications cleared");
      setInternalNotifications([]);
    } catch (err) {
      toast.error("Failed to clear notifications");
    }
  };

  const getIsRead = (notification) =>
    notification?.read ?? notification?.isRead ?? false;

  const unreadCount = notifications.filter(
    (notification) => !getIsRead(notification),
  ).length;

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
        notification?.description?.toLowerCase().includes(keyword)
      );
    });
  }, [notifications, search, filter]);

  return (
    <CustomerWorkspace
      title="Notifications"
      eyebrow="Customer workspace"
      action={
        unreadCount > 0 ? (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="btnsm cursor-pointer"
          >
            Mark all read
          </button>
        ) : null
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
            {notifications.length - unreadCount}
          </strong>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2">
        {["all", "unread", "read"].map((tab) => {
          const isActive = filter === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold capitalize transition-all cursor-pointer ${
                isActive
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--primary)] hover:bg-[var(--soft)] hover:text-[var(--primary)] dark:bg-card"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Notifications List Container */}
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:bg-card dark:border-line">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-10 text-center">
            <EmptyState
              title="No notifications"
              message="You have no notifications in this category."
            />
          </div>
        ) : (
          <NotificationList
            notifications={filteredNotifications}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
        )}
      </div>
    </CustomerWorkspace>
  );
};

export default Notifications;
