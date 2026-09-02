
import { useMemo, useState } from "react";

import AdminHeader from "../../components/admin/AdminHeader";
import AdminSidebar from "../../components/admin/AdminSidebar";

import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";

import NotificationItem from "../../components/notification/NotificationItem";

const Notifications = ({
  user = null,
  notifications = [],
  loading = false,
  notificationCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onLogout,
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredNotifications = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const isRead =
        notification.read ??
        notification.isRead ??
        false;

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
    (notification) =>
      !(notification.read ?? notification.isRead ?? false)
  ).length;

  const handleNotificationClick = (notification) => {
    const id = notification._id || notification.id;

    const isRead =
      notification.read ??
      notification.isRead ??
      false;

    if (!isRead) {
      onMarkAsRead?.(id);
    }

    if (notification.link) {
      onNavigate?.(notification.link);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <div className="lg:pl-72">
        <AdminHeader
          user={user}
          notificationCount={notificationCount || unreadCount}
          onMenuClick={() => setSidebarOpen(true)}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-primary">
                  Admin Center
                </p>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Notifications
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  Stay updated with important activity and system alerts.
                </p>
              </div>

              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={() => onMarkAllAsRead?.()}
                >
                  Mark all as read
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Total
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {notifications.length}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Unread
                </p>

                <p className="mt-2 text-3xl font-bold text-primary">
                  {unreadCount}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Read
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {notifications.length - unreadCount}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="w-full md:max-w-md">
                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search notifications..."
                  />
                </div>

                <div className="flex gap-2">
                  {["all", "unread", "read"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setFilter(item)}
                      className={[
                        "rounded-xl px-4 py-2 text-sm font-medium capitalize transition",
                        filter === item
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground",
                      ].join(" ")}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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
                      const id =
                        notification._id || notification.id;

                      return (
                        <div
                          key={id}
                          className="group relative transition hover:bg-muted/20"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                            className="block w-full text-left"
                          >
                            <NotificationItem
                              notification={notification}
                              onRead={() =>
                                onMarkAsRead?.(id)
                              }
                              onDelete={() =>
                                onDeleteNotification?.(id)
                              }
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

                      <Button
                        variant="outline"
                        onClick={() => onClearAll?.()}
                      >
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
    </div>
  );
};

export default Notifications;
