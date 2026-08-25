import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  profile: null,
  addresses: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",

  initialState,

  reducers: {
    fetchUserStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    fetchUserSuccess: (state, action) => {
      state.loading = false;
      state.profile = action.payload;
      state.error = null;
    },

    fetchUserFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    updateUserStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    updateUserSuccess: (state, action) => {
      state.loading = false;
      state.profile = action.payload;
      state.error = null;
    },

    updateUserFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    setProfile: (state, action) => {
      state.profile = action.payload;
    },

    setAddresses: (state, action) => {
      state.addresses = action.payload;
    },

    addAddress: (state, action) => {
      state.addresses.push(action.payload);
    },

    updateAddress: (state, action) => {
      const index = state.addresses.findIndex(
        (address) => address._id === action.payload._id,
      );

      if (index !== -1) {
        state.addresses[index] = action.payload;
      }
    },

    removeAddress: (state, action) => {
      state.addresses = state.addresses.filter(
        (address) => address._id !== action.payload,
      );
    },

    clearUser: (state) => {
      state.profile = null;
      state.addresses = [];
      state.loading = false;
      state.error = null;
    },

    clearUserError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchUserStart,
  fetchUserSuccess,
  fetchUserFailure,
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  setProfile,
  setAddresses,
  addAddress,
  updateAddress,
  removeAddress,
  clearUser,
  clearUserError,
} = userSlice.actions;

export default userSlice.reducer;
