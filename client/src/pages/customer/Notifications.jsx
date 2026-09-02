
import { useMemo, useState } from "react";

import NotificationList from "../../components/notification/NotificationList";

import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";

const Notifications = ({
  notifications = [],
  loading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onNavigate,
}) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const getIsRead = (notification) =>
    notification?.read ??
    notification?.isRead ??
    false;

  const unreadCount = notifications.filter(
    (notification) => !getIsRead(notification)
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
        notification?.title
          ?.toLowerCase()
          .includes(keyword) ||
        notification?.message
          ?.toLowerCase()
          .includes(keyword) ||
        notification?.description
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [notifications, search, filter]);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Account
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Notifications
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Stay updated with your orders, account and other
            activities.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={onMarkAllAsRead}
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

          <p className="mt-2 text-2xl font-bold">
            {notifications.length}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Unread
          </p>

          <p className="mt-2 text-2xl font-bold text-primary">
            {unreadCount}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Read
          </p>

          <p className="mt-2 text-2xl font-bold">
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

      {/* Notifications */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No notifications found"
              description={
                search
                  ? "Try changing your search or filter."
                  : "You're all caught up."
              }
            />
          </div>
        ) : (
          <NotificationList
            notifications={filteredNotifications}
            onRead={onMarkAsRead}
            onDelete={onDeleteNotification}
            onNavigate={onNavigate}
          />
        )}
      </div>

      {/* Clear */}
      {notifications.length > 0 && (
        <div className="mt-5 flex justify-end">
          <Button
            variant="outline"
            onClick={onClearAll}
          >
            Clear All Notifications
          </Button>
        </div>
      )}

      {/* Back */}
      <button
        type="button"
        onClick={() => onNavigate?.("/")}
        className="mt-8 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        ← Back to Home
      </button>
    </main>
  );
};

export default Notifications;
