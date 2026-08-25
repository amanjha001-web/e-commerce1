import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  sidebarOpen: false,
  mobileMenuOpen: false,

  modal: {
    open: false,
    type: null,
    data: null,
  },

  globalLoading: false,

  searchOpen: false,
  notificationOpen: false,

  theme: "light",
};

const uiSlice = createSlice({
  name: "ui",

  initialState,

  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    openSidebar: (state) => {
      state.sidebarOpen = true;
    },

    closeSidebar: (state) => {
      state.sidebarOpen = false;
    },

    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },

    openMobileMenu: (state) => {
      state.mobileMenuOpen = true;
    },

    closeMobileMenu: (state) => {
      state.mobileMenuOpen = false;
    },

    openModal: (state, action) => {
      state.modal = {
        open: true,
        type: action.payload?.type || null,
        data: action.payload?.data || null,
      };
    },

    closeModal: (state) => {
      state.modal = {
        open: false,
        type: null,
        data: null,
      };
    },

    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },

    openSearch: (state) => {
      state.searchOpen = true;
    },

    closeSearch: (state) => {
      state.searchOpen = false;
    },

    toggleSearch: (state) => {
      state.searchOpen = !state.searchOpen;
    },

    openNotifications: (state) => {
      state.notificationOpen = true;
    },

    closeNotifications: (state) => {
      state.notificationOpen = false;
    },

    toggleNotifications: (state) => {
      state.notificationOpen = !state.notificationOpen;
    },

    setTheme: (state, action) => {
      state.theme = action.payload;
    },

    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
    },

    resetUI: () => initialState,
  },
});

export const {
  toggleSidebar,
  openSidebar,
  closeSidebar,
  toggleMobileMenu,
  openMobileMenu,
  closeMobileMenu,
  openModal,
  closeModal,
  setGlobalLoading,
  openSearch,
  closeSearch,
  toggleSearch,
  openNotifications,
  closeNotifications,
  toggleNotifications,
  setTheme,
  toggleTheme,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;
