import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import paymentService from "../../../services/payment.service";

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong";

// Fetch all payments (GET /admin/payments)
export const fetchPayments = createAsyncThunk(
  "adminPayments/fetchPayments",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await paymentService.getAdminPayments(params);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to fetch payments");
      }
      const data = response?.data ?? response;
      return {
        payments: Array.isArray(data?.payments)
          ? data.payments
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

// Fetch payment details (GET /admin/payments/:id)
export const fetchPaymentById = createAsyncThunk(
  "adminPayments/fetchPaymentById",
  async (paymentId, { rejectWithValue }) => {
    try {
      const response = await paymentService.getAdminPaymentById(paymentId);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to fetch payment");
      }
      return response?.data?.payment ?? response?.data ?? response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// Refund payment (POST /admin/payments/:id/refund)
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
      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// Reconcile payment (POST /admin/payments/reconcile)
export const reconcilePayment = createAsyncThunk(
  "adminPayments/reconcilePayment",
  async (paymentId, { rejectWithValue }) => {
    try {
      const response = await paymentService.adminReconcilePayment(paymentId);
      if (response?.success === false) {
        return rejectWithValue(
          response.message || "Failed to reconcile payment",
        );
      }
      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// Fetch vendor payouts (GET /admin/vendor-payouts)
export const fetchVendorPayouts = createAsyncThunk(
  "adminPayments/fetchVendorPayouts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await paymentService.getVendorPayouts(params);
      if (response?.success === false) {
        return rejectWithValue(
          response.message || "Failed to fetch vendor payouts",
        );
      }
      const data = response?.data ?? response;
      return {
        payouts: Array.isArray(data?.payouts)
          ? data.payouts
          : Array.isArray(data)
            ? data
            : [],
        pagination: data?.pagination || {},
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// Fetch vendor payout by ID (GET /admin/vendor-payouts/:id)
export const fetchVendorPayoutById = createAsyncThunk(
  "adminPayments/fetchVendorPayoutById",
  async (payoutId, { rejectWithValue }) => {
    try {
      const response = await paymentService.getVendorPayoutById(payoutId);
      if (response?.success === false) {
        return rejectWithValue(
          response.message || "Failed to fetch vendor payout",
        );
      }
      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// Update vendor payout status (PATCH /admin/vendor-payouts/:id/status)
export const updateVendorPayoutStatus = createAsyncThunk(
  "adminPayments/updateVendorPayoutStatus",
  async ({ payoutId, status }, { rejectWithValue }) => {
    try {
      const response = await paymentService.updateVendorPayoutStatus(
        payoutId,
        status,
      );
      if (response?.success === false) {
        return rejectWithValue(
          response.message || "Failed to update vendor payout status",
        );
      }
      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const initialState = {
  payments: [],
  selectedPayment: null,
  vendorPayouts: [],
  selectedPayout: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  payoutPagination: {
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
    clearSelectedPayout: (state) => {
      state.selectedPayout = null;
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
      })
      .addCase(reconcilePayment.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(reconcilePayment.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload?.payment || action.payload;
        if (updated?._id) {
          state.payments = state.payments.map((p) =>
            p._id === updated._id ? { ...p, ...updated } : p,
          );
          if (state.selectedPayment?._id === updated._id) {
            state.selectedPayment = { ...state.selectedPayment, ...updated };
          }
        }
      })
      .addCase(reconcilePayment.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to reconcile payment";
      })
      .addCase(fetchVendorPayouts.fulfilled, (state, action) => {
        state.vendorPayouts = action.payload?.payouts || [];
        state.payoutPagination = action.payload?.pagination || {};
      })
      .addCase(fetchVendorPayoutById.fulfilled, (state, action) => {
        state.selectedPayout = action.payload;
      })
      .addCase(updateVendorPayoutStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated?._id) {
          state.vendorPayouts = state.vendorPayouts.map((p) =>
            p._id === updated._id ? { ...p, ...updated } : p,
          );
          if (state.selectedPayout?._id === updated._id) {
            state.selectedPayout = { ...state.selectedPayout, ...updated };
          }
        }
      });
  },
});

export const {
  clearAdminPaymentsError,
  setAdminPaymentsPage,
  clearSelectedPayment,
  clearSelectedPayout,
} = adminPaymentsSlice.actions;

export default adminPaymentsSlice.reducer;
