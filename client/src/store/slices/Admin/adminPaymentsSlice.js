import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import paymentService from "../../../services/payment.service";

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong";

// Fetch all payments
export const fetchPayments = createAsyncThunk(
  "adminPayments/fetchPayments",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await paymentService.getAdminPayments(params);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to fetch payments");
      }
      return {
        payments: Array.isArray(response.data?.payments)
          ? response.data.payments
          : Array.isArray(response.data)
          ? response.data
          : [],
        pagination: response.data?.pagination || {},
        message: response.message || "",
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Fetch payment details
export const fetchPaymentById = createAsyncThunk(
  "adminPayments/fetchPaymentById",
  async (paymentId, { rejectWithValue }) => {
    try {
      const response = await paymentService.getAdminPaymentById(paymentId);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to fetch payment");
      }
      return response.data?.payment || response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Refund payment
export const refundPayment = createAsyncThunk(
  "adminPayments/refundPayment",
  async ({ paymentId, amount, reason }, { rejectWithValue }) => {
    try {
      const response = await paymentService.adminRefundPayment(paymentId, {
        amount,
        reason,
      });
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to refund payment");
      }
      return response.data || response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  payments: [],
  selectedPayment: null,
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

const adminPaymentsSlice = createSlice({
  name: "adminPayments",
  initialState,
  reducers: {
    clearAdminPaymentsError: (state) => {
      state.error = null;
    },
    setAdminPaymentsPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    clearSelectedPayment: (state) => {
      state.selectedPayment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload?.payments || [];
        state.pagination = action.payload?.pagination || {};
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch payments";
      })
      .addCase(fetchPaymentById.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedPayment = action.payload;
      })
      .addCase(fetchPaymentById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload || "Failed to fetch payment";
      })
      .addCase(refundPayment.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(refundPayment.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(refundPayment.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to refund payment";
      });
  },
});

export const {
  clearAdminPaymentsError,
  setAdminPaymentsPage,
  clearSelectedPayment,
} = adminPaymentsSlice.actions;

export default adminPaymentsSlice.reducer;