import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import adminService from "../../../services/admin.service";

// Fetch all vendors
export const fetchAdminVendors = createAsyncThunk(
  "adminVendors/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminService.getVendors(params);

      if (!response?.success) {
        return rejectWithValue(response?.message || "Failed to fetch vendors");
      }

      return {
        vendors: Array.isArray(response.data?.vendors)
          ? response.data.vendors
          : Array.isArray(response.data)
            ? response.data
            : [],
        pagination: response.data?.pagination || {},
        message: response.message || "",
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch vendors",
      );
    }
  },
);

// Fetch vendor details
export const fetchAdminVendorById = createAsyncThunk(
  "adminVendors/fetchById",
  async (vendorId, { rejectWithValue }) => {
    try {
      const response = await adminService.getVendorById(vendorId);

      if (!response?.success) {
        return rejectWithValue(
          response?.message || "Failed to fetch vendor details",
        );
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch vendor details",
      );
    }
  },
);

// Update vendor
export const updateAdminVendor = createAsyncThunk(
  "adminVendors/update",
  async ({ vendorId, vendorData }, { rejectWithValue }) => {
    try {
      const response = await adminService.updateVendor(vendorId, vendorData);

      if (!response?.success) {
        return rejectWithValue(response?.message || "Failed to update vendor");
      }

      return {
        vendor: response.data,
        message: response.message || "Vendor updated successfully",
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update vendor",
      );
    }
  },
);

// Delete vendor
export const deleteAdminVendor = createAsyncThunk(
  "adminVendors/delete",
  async (vendorId, { rejectWithValue }) => {
    try {
      const response = await adminService.deleteVendor(vendorId);

      if (!response?.success) {
        return rejectWithValue(response?.message || "Failed to delete vendor");
      }

      return {
        vendorId,
        message: response.message || "Vendor deleted successfully",
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete vendor",
      );
    }
  },
);

// Activate / deactivate vendor
export const toggleAdminVendorStatus = createAsyncThunk(
  "adminVendors/toggleStatus",
  async ({ vendorId, isActive }, { rejectWithValue }) => {
    try {
      const response = await adminService.toggleVendorStatus(
        vendorId,
        isActive,
      );

      if (!response?.success) {
        return rejectWithValue(
          response?.message || "Failed to update vendor status",
        );
      }

      return {
        vendor: response.data,
        message: response.message || "Vendor status updated successfully",
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update vendor status",
      );
    }
  },
);

// Approve vendor
export const approveAdminVendor = createAsyncThunk(
  "adminVendors/approve",
  async (vendorId, { rejectWithValue }) => {
    try {
      const response = await adminService.approveVendor(vendorId);

      if (!response?.success) {
        return rejectWithValue(response?.message || "Failed to approve vendor");
      }

      return {
        vendor: response.data,
        message: response.message || "Vendor approved successfully",
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to approve vendor",
      );
    }
  },
);

// Reject vendor
export const rejectAdminVendor = createAsyncThunk(
  "adminVendors/reject",
  async ({ vendorId, reason }, { rejectWithValue }) => {
    try {
      const response = await adminService.rejectVendor(vendorId, reason);

      if (!response?.success) {
        return rejectWithValue(response?.message || "Failed to reject vendor");
      }

      return {
        vendor: response.data,
        message: response.message || "Vendor rejected successfully",
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to reject vendor",
      );
    }
  },
);

const initialState = {
  vendors: [],
  selectedVendor: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },

  filters: {
    status: "",
    search: "",
  },

  loading: false,
  detailsLoading: false,
  saving: false,
  deleting: false,
  error: null,
  message: "",
};

const adminVendorsSlice = createSlice({
  name: "adminVendors",
  initialState,

  reducers: {
    setVendorFilters(state, action) {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },

    setSelectedVendor(state, action) {
      state.selectedVendor = action.payload;
    },

    clearSelectedVendor(state) {
      state.selectedVendor = null;
    },

    clearAdminVendorsError(state) {
      state.error = null;
    },

    clearAdminVendorsMessage(state) {
      state.message = "";
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch vendors
      .addCase(fetchAdminVendors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.vendors = action.payload.vendors;
        state.pagination = action.payload.pagination;
        state.message = action.payload.message;
      })
      .addCase(fetchAdminVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch vendors";
      })

      // Fetch vendor details
      .addCase(fetchAdminVendorById.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminVendorById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedVendor = action.payload;
      })
      .addCase(fetchAdminVendorById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload || "Failed to fetch vendor details";
      })

      // Update vendor
      .addCase(updateAdminVendor.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateAdminVendor.fulfilled, (state, action) => {
        state.saving = false;
        const updatedVendor = action.payload.vendor;

        state.vendors = state.vendors.map((vendor) =>
          vendor._id === updatedVendor?._id ? updatedVendor : vendor,
        );

        if (state.selectedVendor?._id === updatedVendor?._id) {
          state.selectedVendor = updatedVendor;
        }

        state.message = action.payload.message;
      })
      .addCase(updateAdminVendor.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to update vendor";
      })

      // Delete vendor
      .addCase(deleteAdminVendor.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteAdminVendor.fulfilled, (state, action) => {
        state.deleting = false;
        state.vendors = state.vendors.filter(
          (vendor) => vendor._id !== action.payload.vendorId,
        );

        if (state.selectedVendor?._id === action.payload.vendorId) {
          state.selectedVendor = null;
        }

        state.message = action.payload.message;
      })
      .addCase(deleteAdminVendor.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "Failed to delete vendor";
      })

      // Toggle status
      .addCase(toggleAdminVendorStatus.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(toggleAdminVendorStatus.fulfilled, (state, action) => {
        state.saving = false;
        const updatedVendor = action.payload.vendor;

        state.vendors = state.vendors.map((vendor) =>
          vendor._id === updatedVendor?._id ? updatedVendor : vendor,
        );

        if (state.selectedVendor?._id === updatedVendor?._id) {
          state.selectedVendor = updatedVendor;
        }

        state.message = action.payload.message;
      })
      .addCase(toggleAdminVendorStatus.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to update vendor status";
      })

      // Approve vendor
      .addCase(approveAdminVendor.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(approveAdminVendor.fulfilled, (state, action) => {
        state.saving = false;
        const updatedVendor = action.payload.vendor;

        state.vendors = state.vendors.map((vendor) =>
          vendor._id === updatedVendor?._id ? updatedVendor : vendor,
        );

        if (state.selectedVendor?._id === updatedVendor?._id) {
          state.selectedVendor = updatedVendor;
        }

        state.message = action.payload.message;
      })
      .addCase(approveAdminVendor.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to approve vendor";
      })

      // Reject vendor
      .addCase(rejectAdminVendor.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(rejectAdminVendor.fulfilled, (state, action) => {
        state.saving = false;
        const updatedVendor = action.payload.vendor;

        state.vendors = state.vendors.map((vendor) =>
          vendor._id === updatedVendor?._id ? updatedVendor : vendor,
        );

        if (state.selectedVendor?._id === updatedVendor?._id) {
          state.selectedVendor = updatedVendor;
        }

        state.message = action.payload.message;
      })
      .addCase(rejectAdminVendor.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to reject vendor";
      });
  },
});

export const {
  setVendorFilters,
  setSelectedVendor,
  clearSelectedVendor,
  clearAdminVendorsError,
  clearAdminVendorsMessage,
} = adminVendorsSlice.actions;

export default adminVendorsSlice.reducer;
