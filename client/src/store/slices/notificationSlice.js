import { createSlice } from "@reduxjs/toolkit";

const isItemRead = (item) => Boolean(item?.isRead ?? item?.read ?? false);
const getItemId = (item) => item?._id || item?.id;

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: "notification",

  initialState,

  reducers: {
    fetchNotificationsStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    fetchNotificationsSuccess: (state, action) => {
      state.loading = false;

      state.notifications = action.payload?.notifications || [];
      state.unreadCount =
        action.payload?.unreadCount ??
        state.notifications.filter((notification) => !isItemRead(notification))
          .length;

      state.error = null;
    },

    fetchNotificationsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);

      if (!isItemRead(action.payload)) {
        state.unreadCount += 1;
      }
    },

    markAsRead: (state, action) => {
      const notification = state.notifications.find(
        (item) => String(getItemId(item)) === String(action.payload),
      );

      if (notification && !isItemRead(notification)) {
        notification.isRead = true;
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    markAllAsRead: (state) => {
      state.notifications.forEach((notification) => {
        notification.isRead = true;
        notification.read = true;
      });

      state.unreadCount = 0;
    },

    removeNotification: (state, action) => {
      const notification = state.notifications.find(
        (item) => String(getItemId(item)) === String(action.payload),
      );

      if (notification && !isItemRead(notification)) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }

      state.notifications = state.notifications.filter(
        (item) => String(getItemId(item)) !== String(action.payload),
      );
    },

    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },

    setNotifications: (state, action) => {
      state.notifications = Array.isArray(action.payload) ? action.payload : [];

      state.unreadCount = state.notifications.filter(
        (notification) => !isItemRead(notification),
      ).length;
    },

    setUnreadCount: (state, action) => {
      state.unreadCount = Math.max(0, Number(action.payload) || 0);
    },

    setNotificationLoading: (state, action) => {
      state.loading = action.payload;
    },

    clearNotificationError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchNotificationsStart,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearNotifications,
  setNotifications,
  setUnreadCount,
  setNotificationLoading,
  clearNotificationError,
} = notificationSlice.actions;

export default notificationSlice.reducer;
