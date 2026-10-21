
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import vendorRequestService from "../../services/vendorRequest.service";

// Handle API envelope
// { statusCode, data, message, success }
const getPayloadData = (response) => response?.data ?? response;

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

// Fetch all vendor requests
export const fetchVendorRequests = createAsyncThunk(
  "vendorRequests/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response =
        await vendorRequestService.getAdminRequests(params);

      const result = getPayloadData(response);

      return {
        requests: result?.requests ?? [],
        pagination: result?.pagination ?? {},
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch vendor requests.")
      );
    }
  }
);

// Fetch vendor request by ID
export const fetchVendorRequestById = createAsyncThunk(
  "vendorRequests/fetchById",
  async (requestId, { rejectWithValue }) => {
    try {
      if (!requestId) {
        return rejectWithValue("Vendor request ID is required.");
      }

      const response =
        await vendorRequestService.getRequestById(requestId);

      return getPayloadData(response);
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch request details.")
      );
    }
  }
);

// Approve vendor request
export const approveVendorRequest = createAsyncThunk(
  "vendorRequests/approve",
  async (requestId, { rejectWithValue }) => {
    try {
      const response =
        await vendorRequestService.approveRequest(requestId);

      return {
        requestId,
        result: getPayloadData(response),
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to approve request.")
      );
    }
  }
);

// Reject vendor request
// Dispatch: { requestId, reason }
export const rejectVendorRequest = createAsyncThunk(
  "vendorRequests/reject",
  async ({ requestId, reason }, { rejectWithValue }) => {
    try {
      const response = await vendorRequestService.rejectRequest(
        requestId,
        reason
      );

      return {
        requestId,
        result: getPayloadData(response),
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to reject request.")
      );
    }
  }
);

// Review vendor request
// Dispatch: { requestId, reviewData }
export const reviewVendorRequest = createAsyncThunk(
  "vendorRequests/review",
  async ({ requestId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await vendorRequestService.reviewRequest(
        requestId,
        reviewData
      );

      return {
        requestId,
        result: getPayloadData(response),
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to review request.")
      );
    }
  }
);

// Restore vendor request
export const restoreVendorRequest = createAsyncThunk(
  "vendorRequests/restore",
  async (requestId, { rejectWithValue }) => {
    try {
      const response =
        await vendorRequestService.restoreRequest(requestId);

      return {
        requestId,
        result: getPayloadData(response),
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to restore request.")
      );
    }
  }
);

// Delete vendor request
export const deleteVendorRequest = createAsyncThunk(
  "vendorRequests/delete",
  async (requestId, { rejectWithValue }) => {
    try {
      const response =
        await vendorRequestService.deleteRequest(requestId);

      return {
        requestId,
        result: getPayloadData(response),
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to delete request.")
      );
    }
  }
);

const initialState = {
  requests: [],
  selectedRequest: null,

  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },

  loading: false,
  detailsLoading: false,
  saving: false,

  error: null,
  successMessage: null,
};

const vendorRequestSlice = createSlice({
  name: "vendorRequests",
  initialState,

  reducers: {
    clearVendorRequestMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },

    clearSelectedVendorRequest: (state) => {
      state.selectedRequest = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // ========================================
      // FETCH ALL REQUESTS
      // ========================================
      .addCase(fetchVendorRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchVendorRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.requests;

        state.pagination = {
          ...state.pagination,
          ...action.payload.pagination,
        };
      })

      .addCase(fetchVendorRequests.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Failed to fetch requests.";
      })

      // ========================================
      // FETCH REQUEST DETAILS
      // ========================================
      .addCase(fetchVendorRequestById.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })

      .addCase(fetchVendorRequestById.fulfilled, (state, action) => {
        state.detailsLoading = false;

        // Supports APIs returning { request: {...} }
        state.selectedRequest =
          action.payload?.request ?? action.payload;
      })

      .addCase(fetchVendorRequestById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error =
          action.payload || "Failed to fetch details.";
      })

      // ========================================
      // APPROVE REQUEST
      // ========================================
      .addCase(approveVendorRequest.fulfilled, (state, action) => {
        state.saving = false;
        state.successMessage =
          "Vendor request approved successfully.";

        const { requestId, result } = action.payload;
        const updated = result?.request ?? result;

        state.requests = state.requests.map((request) =>
          request._id === requestId
            ? {
                ...request,
                ...(updated && typeof updated === "object"
                  ? updated
                  : {}),
                status: "approved",
              }
            : request
        );

        if (state.selectedRequest?._id === requestId) {
          state.selectedRequest = {
            ...state.selectedRequest,
            ...(updated && typeof updated === "object"
              ? updated
              : {}),
            status: "approved",
          };
        }
      })

      // ========================================
      // REJECT REQUEST
      // ========================================
      .addCase(rejectVendorRequest.fulfilled, (state, action) => {
        state.saving = false;
        state.successMessage =
          "Vendor request rejected successfully.";

        const { requestId, result } = action.payload;
        const updated = result?.request ?? result;

        state.requests = state.requests.map((request) =>
          request._id === requestId
            ? {
                ...request,
                ...(updated && typeof updated === "object"
                  ? updated
                  : {}),
                status: "rejected",
              }
            : request
        );

        if (state.selectedRequest?._id === requestId) {
          state.selectedRequest = {
            ...state.selectedRequest,
            ...(updated && typeof updated === "object"
              ? updated
              : {}),
            status: "rejected",
          };
        }
      })

      // ========================================
      // REVIEW REQUEST
      // ========================================
      .addCase(reviewVendorRequest.fulfilled, (state, action) => {
        state.saving = false;
        state.successMessage =
          "Vendor request reviewed successfully.";

        const { requestId, result } = action.payload;
        const updated = result?.request ?? result;

        if (updated && typeof updated === "object") {
          state.requests = state.requests.map((request) =>
            request._id === requestId
              ? { ...request, ...updated }
              : request
          );

          if (state.selectedRequest?._id === requestId) {
            state.selectedRequest = {
              ...state.selectedRequest,
              ...updated,
            };
          }
        }
      })

      // ========================================
      // RESTORE REQUEST
      // ========================================
      .addCase(restoreVendorRequest.fulfilled, (state, action) => {
        state.saving = false;
        state.successMessage =
          "Vendor request restored successfully.";

        const { requestId, result } = action.payload;
        const updated = result?.request ?? result;

        if (updated && typeof updated === "object") {
          state.requests = state.requests.map((request) =>
            request._id === requestId
              ? {
                  ...request,
                  ...updated,
                  isDeleted: false,
                }
              : request
          );

          if (state.selectedRequest?._id === requestId) {
            state.selectedRequest = {
              ...state.selectedRequest,
              ...updated,
              isDeleted: false,
            };
          }
        }
      })

      // ========================================
      // DELETE REQUEST
      // ========================================
      .addCase(deleteVendorRequest.fulfilled, (state, action) => {
        state.saving = false;
        state.successMessage =
          "Vendor request deleted successfully.";

        const { requestId } = action.payload;

        state.requests = state.requests.filter(
          (request) => request._id !== requestId
        );

        if (state.selectedRequest?._id === requestId) {
          state.selectedRequest = null;
        }

        state.pagination.total = Math.max(
          0,
          state.pagination.total - 1
        );
      })

      // ========================================
      // ALL ACTIONS: PENDING
      // IMPORTANT: addMatcher comes AFTER all addCase calls.
      // ========================================
      .addMatcher(
        (action) =>
          [
            approveVendorRequest.pending.type,
            rejectVendorRequest.pending.type,
            reviewVendorRequest.pending.type,
            restoreVendorRequest.pending.type,
            deleteVendorRequest.pending.type,
          ].includes(action.type),
        (state) => {
          state.saving = true;
          state.error = null;
          state.successMessage = null;
        }
      )

      // ========================================
      // ALL ACTIONS: REJECTED
      // ========================================
      .addMatcher(
        (action) =>
          [
            approveVendorRequest.rejected.type,
            rejectVendorRequest.rejected.type,
            reviewVendorRequest.rejected.type,
            restoreVendorRequest.rejected.type,
            deleteVendorRequest.rejected.type,
          ].includes(action.type),
        (state, action) => {
          state.saving = false;
          state.error =
            action.payload || "Request action failed.";
        }
      );
  },
});

export const {
  clearVendorRequestMessages,
  clearSelectedVendorRequest,
} = vendorRequestSlice.actions;

export default vendorRequestSlice.reducer;
