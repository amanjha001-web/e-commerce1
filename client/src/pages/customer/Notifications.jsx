import { useMemo, useState } from "react";

import NotificationList from "../../components/notification/NotificationList";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import CustomerWorkspace from "../../components/layout/CustomerWorkspace";

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
            onClick={onMarkAllAsRead}
            className="btnsm"
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
            onMarkAsRead={onMarkAsRead}
            onDelete={onDeleteNotification}
          />
        )}
      </div>
    </CustomerWorkspace>
  );
};

export default Notifications;
