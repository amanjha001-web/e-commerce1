import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import adminService from "../../../services/admin.service";

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong";

export const fetchAdminOrders = createAsyncThunk(
  "adminOrders/fetchOrders",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminService.getOrders(params);

      if (response?.success === false) {
        return rejectWithValue(response?.message || "Failed to fetch orders");
      }

      const data = response?.data ?? response;
      return {
        orders: Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data)
            ? data
            : [],
        pagination: data?.pagination || {},
        message: response?.message || "",
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchAdminOrderById = createAsyncThunk(
  "adminOrders/fetchOrderById",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await adminService.getOrderById(orderId);
      if (response?.success === false) {
        return rejectWithValue(response?.message || "Failed to fetch order");
      }
      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateAdminOrderStatus = createAsyncThunk(
  "adminOrders/updateStatus",
  async ({ orderId, status, note = "" }, { rejectWithValue }) => {
    try {
      const response = await adminService.updateOrderStatus(
        orderId,
        status,
        note,
      );
      if (response?.success === false) {
        return rejectWithValue(
          response?.message || "Failed to update order status",
        );
      }
      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const cancelAdminOrder = createAsyncThunk(
  "adminOrders/cancelOrder",
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const response = await adminService.cancelOrder(orderId, reason);
      if (response?.success === false) {
        return rejectWithValue(response?.message || "Failed to cancel order");
      }
      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const processAdminOrderRefund = createAsyncThunk(
  "adminOrders/processRefund",
  async ({ orderId, amount, reason }, { rejectWithValue }) => {
    try {
      const response = await adminService.processRefund(orderId, {
        amount,
        reason,
      });
      if (response?.success === false) {
        return rejectWithValue(response?.message || "Failed to process refund");
      }
      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateAdminOrderShipping = createAsyncThunk(
  "adminOrders/updateShipping",
  async ({ orderId, shippingData }, { rejectWithValue }) => {
    try {
      const response = await adminService.updateOrderShipping(
        orderId,
        shippingData,
      );
      if (response?.success === false) {
        return rejectWithValue(
          response?.message || "Failed to update order shipping",
        );
      }
      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchAdminOrderHistory = createAsyncThunk(
  "adminOrders/fetchHistory",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await adminService.getOrderStatusHistory(orderId);
      if (response?.success === false) {
        return rejectWithValue(
          response?.message || "Failed to fetch order history",
        );
      }
      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const initialState = {
  orders: [],
  selectedOrder: null,
  orderHistory: [],
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
      state.orderHistory = [];
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
      })
      .addCase(fetchAdminOrderById.fulfilled, (state, action) => {
        state.selectedOrder = action.payload;
      })
      .addCase(fetchAdminOrderHistory.fulfilled, (state, action) => {
        state.orderHistory = Array.isArray(action.payload)
          ? action.payload
          : [];
      })
      .addCase(updateAdminOrderStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated?._id) {
          state.orders = state.orders.map((o) =>
            o._id === updated._id ? { ...o, ...updated } : o,
          );
          if (state.selectedOrder?._id === updated._id) {
            state.selectedOrder = { ...state.selectedOrder, ...updated };
          }
        }
      })
      .addCase(cancelAdminOrder.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated?._id) {
          state.orders = state.orders.map((o) =>
            o._id === updated._id ? { ...o, ...updated } : o,
          );
          if (state.selectedOrder?._id === updated._id) {
            state.selectedOrder = { ...state.selectedOrder, ...updated };
          }
        }
      })
      .addCase(updateAdminOrderShipping.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated?._id) {
          state.orders = state.orders.map((o) =>
            o._id === updated._id ? { ...o, ...updated } : o,
          );
          if (state.selectedOrder?._id === updated._id) {
            state.selectedOrder = { ...state.selectedOrder, ...updated };
          }
        }
      });
  },
});

export const { clearAdminOrdersError, setAdminOrdersPage, clearSelectedOrder } =
  adminOrdersSlice.actions;

export default adminOrdersSlice.reducer;
