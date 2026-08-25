import { createSlice } from "@reduxjs/toolkit";

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

      state.notifications = action.payload.notifications || [];
      state.unreadCount =
        action.payload.unreadCount ??
        state.notifications.filter((notification) => !notification.isRead)
          .length;

      state.error = null;
    },

    fetchNotificationsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);

      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },

    markAsRead: (state, action) => {
      const notification = state.notifications.find(
        (item) => item._id === action.payload,
      );

      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    markAllAsRead: (state) => {
      state.notifications.forEach((notification) => {
        notification.isRead = true;
      });

      state.unreadCount = 0;
    },

    removeNotification: (state, action) => {
      const notification = state.notifications.find(
        (item) => item._id === action.payload,
      );

      if (notification && !notification.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }

      state.notifications = state.notifications.filter(
        (item) => item._id !== action.payload,
      );
    },

    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },

    setNotifications: (state, action) => {
      state.notifications = action.payload || [];

      state.unreadCount = state.notifications.filter(
        (notification) => !notification.isRead,
      ).length;
    },

    setUnreadCount: (state, action) => {
      state.unreadCount = Math.max(0, action.payload);
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
