import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import vendorRequestService from "../../services/vendorRequest.service";
import adminService from "../../services/admin.service";

const getPayloadData = (response) => response?.data ?? response;

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

// Fetch all vendor requests (combines /admin/vendor-requests and /vendor-requests)
export const fetchVendorRequests = createAsyncThunk(
  "vendorRequests/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const [vrRes, adminVrRes] = await Promise.allSettled([
        vendorRequestService.getAdminRequests(params),
        params?.onlyPending
          ? adminService.getPendingVendorRequests(params)
          : adminService.getVendorRequests(params),
      ]);

      const vrData =
        vrRes.status === "fulfilled" ? getPayloadData(vrRes.value) : null;
      const adminData =
        adminVrRes.status === "fulfilled"
          ? getPayloadData(adminVrRes.value)
          : null;

      const listA = Array.isArray(vrData?.requests)
        ? vrData.requests
        : Array.isArray(vrData)
          ? vrData
          : [];
      const listB = Array.isArray(adminData?.requests)
        ? adminData.requests.map((item) => ({ ...item, _source: "adminVendor" }))
        : Array.isArray(adminData)
          ? adminData.map((item) => ({ ...item, _source: "adminVendor" }))
          : [];

      const seen = new Set();
      const merged = [];
      for (const item of [...listA, ...listB]) {
        const key = String(item?._id || item?.id || "");
        if (key && !seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      }

      if (
        vrRes.status === "rejected" &&
        adminVrRes.status === "rejected"
      ) {
        return rejectWithValue(
          getErrorMessage(
            vrRes.reason || adminVrRes.reason,
            "Failed to fetch vendor requests.",
          ),
        );
      }

      return {
        requests: merged,
        pagination: vrData?.pagination || adminData?.pagination || {},
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch vendor requests."),
      );
    }
  },
);

// Fetch pending vendor requests (/admin/vendor-requests/pending)
export const fetchPendingVendorRequests = createAsyncThunk(
  "vendorRequests/fetchPending",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminService.getPendingVendorRequests(params);
      const result = getPayloadData(response);
      return {
        requests: result?.requests ?? [],
        pagination: result?.pagination ?? {},
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch pending vendor requests."),
      );
    }
  },
);

// Fetch vendor request by ID (/vendor-requests/:id or /admin/vendor-requests/:id)
export const fetchVendorRequestById = createAsyncThunk(
  "vendorRequests/fetchById",
  async (requestId, { rejectWithValue }) => {
    try {
      if (!requestId) {
        return rejectWithValue("Vendor request ID is required.");
      }

      try {
        const response = await adminService.getVendorRequestById(requestId);
        return getPayloadData(response);
      } catch {
        const response = await vendorRequestService.getRequestById(requestId);
        return getPayloadData(response);
      }
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch request details."),
      );
    }
  },
);

// Approve vendor request (/admin/vendors/:id/approve or /vendor-requests/:id/approve)
export const approveVendorRequest = createAsyncThunk(
  "vendorRequests/approve",
  async (requestId, { getState, rejectWithValue }) => {
    try {
      const existing = getState()?.vendorRequests?.requests?.find(
        (r) => r._id === requestId,
      );
      let response;
      if (existing?._source === "adminVendor") {
        response = await adminService.approveVendor(requestId);
      } else {
        try {
          response = await vendorRequestService.approveRequest(requestId);
        } catch {
          response = await adminService.approveVendor(requestId);
        }
      }

      return {
        requestId,
        result: getPayloadData(response),
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to approve request."),
      );
    }
  },
);

// Reject vendor request (/admin/vendors/:id/reject or /vendor-requests/:id/reject)
export const rejectVendorRequest = createAsyncThunk(
  "vendorRequests/reject",
  async ({ requestId, reason }, { getState, rejectWithValue }) => {
    try {
      const safeReason =
        reason && String(reason).trim().length >= 5
          ? String(reason).trim()
          : "Application rejected by administrator";
      const existing = getState()?.vendorRequests?.requests?.find(
        (r) => r._id === requestId,
      );
      let response;
      if (existing?._source === "adminVendor") {
        response = await adminService.rejectVendor(requestId, safeReason);
      } else {
        try {
          response = await vendorRequestService.rejectRequest(
            requestId,
            safeReason,
          );
        } catch {
          response = await adminService.rejectVendor(requestId, safeReason);
        }
      }

      return {
        requestId,
        result: getPayloadData(response),
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to reject request."),
      );
    }
  },
);

// Review vendor request (/vendor-requests/:id/review)
export const reviewVendorRequest = createAsyncThunk(
  "vendorRequests/review",
  async ({ requestId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await vendorRequestService.reviewRequest(
        requestId,
        reviewData,
      );

      return {
        requestId,
        result: getPayloadData(response),
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to review request."),
      );
    }
  },
);

// Restore vendor request (/vendor-requests/:id/restore)
export const restoreVendorRequest = createAsyncThunk(
  "vendorRequests/restore",
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await vendorRequestService.restoreRequest(requestId);

      return {
        requestId,
        result: getPayloadData(response),
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to restore request."),
      );
    }
  },
);

// Delete vendor request (/vendor-requests/:id or /admin/vendors/:id)
export const deleteVendorRequest = createAsyncThunk(
  "vendorRequests/delete",
  async (requestId, { getState, rejectWithValue }) => {
    try {
      const existing = getState()?.vendorRequests?.requests?.find(
        (r) => r._id === requestId,
      );
      let response;
      if (existing?._source === "adminVendor") {
        response = await adminService.deleteVendor(requestId);
      } else {
        try {
          response = await vendorRequestService.deleteRequest(requestId);
        } catch {
          response = await adminService.deleteVendor(requestId);
        }
      }

      return {
        requestId,
        result: getPayloadData(response),
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to delete request."),
      );
    }
  },
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
        state.error = action.payload || "Failed to fetch requests.";
      })
      .addCase(fetchPendingVendorRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.requests;
        state.pagination = {
          ...state.pagination,
          ...action.payload.pagination,
        };
      })
      .addCase(fetchVendorRequestById.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchVendorRequestById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedRequest = action.payload?.request ?? action.payload;
      })
      .addCase(fetchVendorRequestById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload || "Failed to fetch details.";
      })
      .addCase(approveVendorRequest.fulfilled, (state, action) => {
        state.saving = false;
        state.successMessage = "Vendor request approved successfully.";

        const { requestId, result } = action.payload;
        const updated = result?.request ?? result;

        state.requests = state.requests.map((request) =>
          request._id === requestId
            ? {
                ...request,
                ...(updated && typeof updated === "object" ? updated : {}),
                status: "approved",
                isApproved: true,
              }
            : request,
        );

        if (state.selectedRequest?._id === requestId) {
          state.selectedRequest = {
            ...state.selectedRequest,
            ...(updated && typeof updated === "object" ? updated : {}),
            status: "approved",
            isApproved: true,
          };
        }
      })
      .addCase(rejectVendorRequest.fulfilled, (state, action) => {
        state.saving = false;
        state.successMessage = "Vendor request rejected successfully.";

        const { requestId, result } = action.payload;
        const updated = result?.request ?? result;

        state.requests = state.requests.map((request) =>
          request._id === requestId
            ? {
                ...request,
                ...(updated && typeof updated === "object" ? updated : {}),
                status: "rejected",
                isApproved: false,
              }
            : request,
        );

        if (state.selectedRequest?._id === requestId) {
          state.selectedRequest = {
            ...state.selectedRequest,
            ...(updated && typeof updated === "object" ? updated : {}),
            status: "rejected",
            isApproved: false,
          };
        }
      })
      .addCase(reviewVendorRequest.fulfilled, (state, action) => {
        state.saving = false;
        state.successMessage = "Vendor request reviewed successfully.";

        const { requestId, result } = action.payload;
        const updated = result?.request ?? result;

        if (updated && typeof updated === "object") {
          state.requests = state.requests.map((request) =>
            request._id === requestId ? { ...request, ...updated } : request,
          );

          if (state.selectedRequest?._id === requestId) {
            state.selectedRequest = {
              ...state.selectedRequest,
              ...updated,
            };
          }
        }
      })
      .addCase(restoreVendorRequest.fulfilled, (state, action) => {
        state.saving = false;
        state.successMessage = "Vendor request restored successfully.";

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
              : request,
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
      .addCase(deleteVendorRequest.fulfilled, (state, action) => {
        state.saving = false;
        state.successMessage = "Vendor request deleted successfully.";

        const { requestId } = action.payload;

        state.requests = state.requests.filter(
          (request) => request._id !== requestId,
        );

        if (state.selectedRequest?._id === requestId) {
          state.selectedRequest = null;
        }

        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
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
        },
      )
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
          state.error = action.payload || "Request action failed.";
        },
      );
  },
});

export const { clearVendorRequestMessages, clearSelectedVendorRequest } =
  vendorRequestSlice.actions;

export default vendorRequestSlice.reducer;
