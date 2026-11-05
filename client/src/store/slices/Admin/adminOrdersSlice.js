import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import adminService from "../../../services/admin.service";

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong";

export const fetchAdminOrders = createAsyncThunk(
  "adminOrders/fetchOrders",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminService.getOrders(params);

      if (!response?.success) {
        return rejectWithValue(response?.message || "Failed to fetch orders");
      }

      return {
        orders: Array.isArray(response.data?.orders)
          ? response.data.orders
          : Array.isArray(response.data)
          ? response.data
          : [],
        pagination: response.data?.pagination || {},
        message: response.message || "",
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const initialState = {
  orders: [],
  selectedOrder: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  loading: false,
  saving: false,
  error: null,
};

const adminOrdersSlice = createSlice({
  name: "adminOrders",
  initialState,
  reducers: {
    clearAdminOrdersError: (state) => {
      state.error = null;
    },
    setAdminOrdersPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload?.orders ?? [];
        state.pagination = action.payload?.pagination ?? {};
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch orders";
      });
  },
});

export const { clearAdminOrdersError, setAdminOrdersPage, clearSelectedOrder } =
  adminOrdersSlice.actions;

export default adminOrdersSlice.reducer;