import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import adminService from "../../services/admin.service";

export const fetchAdminVendors = createAsyncThunk(
  "adminVendors/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminService.getVendors(params);

      if (!response?.success) {
        return rejectWithValue(response?.message || "Failed to fetch vendors");
      }

      return {
        vendors: Array.isArray(response.data) ? response.data : [],
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

const initialState = {
  vendors: [],
  selectedVendor: null,

  filters: {
    status: "",
    search: "",
  },

  loading: false,
  saving: false,
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
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminVendors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchAdminVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.vendors = action.payload.vendors;
        state.message = action.payload.message;
      })

      .addCase(fetchAdminVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch vendors";
      });
  },
});

export const {
  setVendorFilters,
  setSelectedVendor,
  clearSelectedVendor,
  clearAdminVendorsError,
} = adminVendorsSlice.actions;

export default adminVendorsSlice.reducer;
