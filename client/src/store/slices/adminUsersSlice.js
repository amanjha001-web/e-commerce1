import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import adminService from "../../services/admin.service";

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong";

const fetchAdminUsers = createAsyncThunk(
  "adminUsers/fetchUsers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminService.getUsers(params);

      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to fetch users");
      }

      // API shape: { success, data: { users, pagination } }
      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const fetchAdminUserById = createAsyncThunk(
  "adminUsers/fetchUserById",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await adminService.getUserById(userId);

      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to fetch user");
      }

      const data = response?.data ?? response;
      return data?.user ?? data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const updateAdminUser = createAsyncThunk(
  "adminUsers/updateUser",
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const response = await adminService.updateUser(userId, userData);

      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to update user");
      }

      const data = response?.data ?? response;
      return data?.user ?? data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const deleteAdminUser = createAsyncThunk(
  "adminUsers/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await adminService.deleteUser(userId);

      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to delete user");
      }

      return userId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const toggleAdminUserStatus = createAsyncThunk(
  "adminUsers/toggleStatus",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await adminService.toggleUserStatus(userId);

      if (response?.success === false) {
        return rejectWithValue(
          response.message || "Failed to update user status",
        );
      }

      // Don't guess the new isBlocked value.
      // The component will refetch the list after success.
      return userId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const initialState = {
  users: [],
  selectedUser: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  loading: false,
  detailsLoading: false,
  saving: false,
  error: null,
};

const adminUsersSlice = createSlice({
  name: "adminUsers",
  initialState,
  reducers: {
    clearSelectedUser(state) {
      state.selectedUser = null;
    },
    clearAdminUsersError(state) {
      state.error = null;
    },
    setAdminUsersPage(state, action) {
      state.pagination.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // LIST
      .addCase(fetchAdminUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload?.users ?? [];
        state.pagination = {
          ...state.pagination,
          ...(action.payload?.pagination ?? {}),
        };
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // DETAILS
      .addCase(fetchAdminUserById.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminUserById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedUser = action.payload ?? null;
      })
      .addCase(fetchAdminUserById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload || action.error.message;
      })

      // UPDATE
      .addCase(updateAdminUser.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateAdminUser.fulfilled, (state, action) => {
        state.saving = false;

        const updatedUser = action.payload;
        if (!updatedUser?._id) return;

        state.users = state.users.map((user) =>
          user._id === updatedUser._id ? { ...user, ...updatedUser } : user,
        );

        if (state.selectedUser?._id === updatedUser._id) {
          state.selectedUser = { ...state.selectedUser, ...updatedUser };
        }
      })
      .addCase(updateAdminUser.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || action.error.message;
      })

      // DELETE
      .addCase(deleteAdminUser.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteAdminUser.fulfilled, (state, action) => {
        state.saving = false;
        const deletedId = action.payload;

        state.users = state.users.filter((user) => user._id !== deletedId);

        if (state.selectedUser?._id === deletedId) {
          state.selectedUser = null;
        }

        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteAdminUser.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || action.error.message;
      })

      // BLOCK / UNBLOCK
      .addCase(toggleAdminUserStatus.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(toggleAdminUserStatus.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(toggleAdminUserStatus.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearSelectedUser, clearAdminUsersError, setAdminUsersPage } =
  adminUsersSlice.actions;

export {
  fetchAdminUsers,
  fetchAdminUserById,
  updateAdminUser,
  deleteAdminUser,
  toggleAdminUserStatus,
};

export default adminUsersSlice.reducer;
