import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";

import NotificationItem from "../../components/notification/NotificationItem";
import notificationService from "../../services/notification.service";

const Notifications = ({
  notifications: propNotifications,
  loading: propLoading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onNavigate,
}) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [localNotifications, setLocalNotifications] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (Array.isArray(propNotifications)) return;
    try {
      setLocalLoading(true);
      const response = await notificationService.getNotifications();
      const list =
        response?.data?.notifications ||
        response?.notifications ||
        (Array.isArray(response?.data) ? response.data : []);
      setLocalNotifications(Array.isArray(list) ? list : []);
    } catch {
      setLocalNotifications([]);
    } finally {
      setLocalLoading(false);
    }
  }, [propNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const notifications = Array.isArray(propNotifications)
    ? propNotifications
    : localNotifications;
  const loading = propLoading || localLoading;

  const handleMarkAsRead = async (id) => {
    if (onMarkAsRead) {
      onMarkAsRead(id);
      return;
    }
    try {
      await notificationService.markAsRead(id);
      setLocalNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id) === id ? { ...n, isRead: true, read: true } : n,
        ),
      );
    } catch {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
      return;
    }
    try {
      await notificationService.markAllAsRead();
      setLocalNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true })),
      );
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all notifications as read");
    }
  };

  const handleDeleteNotification = async (id) => {
    if (onDeleteNotification) {
      onDeleteNotification(id);
      return;
    }
    try {
      await notificationService.deleteNotification(id);
      setLocalNotifications((prev) =>
        prev.filter((n) => (n._id || n.id) !== id),
      );
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const handleClearAll = async () => {
    if (onClearAll) {
      onClearAll();
      return;
    }
    try {
      await notificationService.clearNotifications();
      setLocalNotifications([]);
      toast.success("Notifications cleared");
    } catch {
      toast.error("Failed to clear notifications");
    }
  };

  const filteredNotifications = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const isRead = notification.read ?? notification.isRead ?? false;

      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !isRead) ||
        (filter === "read" && isRead);

      if (!matchesFilter) return false;

      if (!keyword) return true;

      return (
        notification.title?.toLowerCase().includes(keyword) ||
        notification.message?.toLowerCase().includes(keyword) ||
        notification.description?.toLowerCase().includes(keyword)
      );
    });
  }, [notifications, search, filter]);

  const unreadCount = notifications.filter(
    (notification) => !(notification.read ?? notification.isRead ?? false),
  ).length;

  const handleNotificationClick = (notification) => {
    const id = notification._id || notification.id;

    const isRead = notification.read ?? notification.isRead ?? false;

    if (!isRead) {
      handleMarkAsRead(id);
    }

    if (notification.link) {
      onNavigate?.(notification.link);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="eyebrow">Admin Center</div>
              <h1 className="text-2xl font-black text-[var(--text)] dark:text-foreground">
                Notifications
              </h1>

              <p className="mt-1 text-xs font-medium text-[var(--muted)]">
                Stay updated with important activity and system alerts.
              </p>
            </div>

            {unreadCount > 0 && (
              <Button variant="outline" onClick={() => handleMarkAllAsRead()} className="outlinebtn">
                Mark all as read
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="stat-card">
              <p className="text-xs font-bold text-[var(--muted)]">Total</p>

              <p className="mt-2 text-2xl font-black text-[var(--text)] dark:text-foreground">{notifications.length}</p>
            </div>

            <div className="stat-card">
              <p className="text-xs font-bold text-[var(--muted)]">Unread</p>

              <p className="mt-2 text-2xl font-black text-[var(--primary)]">
                {unreadCount}
              </p>
            </div>

            <div className="stat-card">
              <p className="text-xs font-bold text-[var(--muted)]">Read</p>

              <p className="mt-2 text-2xl font-black text-[var(--text)] dark:text-foreground">
                {notifications.length - unreadCount}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="panel mb-6 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="w-full md:max-w-md">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search notifications..."
                />
              </div>

              <div className="flex gap-2">
                {["all", "unread", "read"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`btnsm cursor-pointer capitalize ${
                      filter === item
                        ? "primary"
                        : ""
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:border-line dark:bg-card">
            {loading ? (
              <div className="flex min-h-[350px] items-center justify-center">
                <Loader />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No notifications found"
                  description={
                    search
                      ? "Try changing your search term or filter."
                      : "You're all caught up."
                  }
                />
              </div>
            ) : (
              <>
                <div className="divide-y divide-border">
                  {filteredNotifications.map((notification) => {
                    const id = notification._id || notification.id;

                    return (
                      <div
                        key={id}
                        className="group relative transition hover:bg-muted/20"
                      >
                        <button
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className="block w-full text-left"
                        >
                          <NotificationItem
                            notification={notification}
                            onRead={() => handleMarkAsRead(id)}
                            onDelete={() => handleDeleteNotification(id)}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Actions */}
                {notifications.length > 0 && (
                  <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredNotifications.length} of{" "}
                      {notifications.length} notifications
                    </p>

                    <Button variant="outline" onClick={() => handleClearAll()}>
                      Clear all
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Notifications;
