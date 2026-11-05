import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import shippingService from "../../../services/shipping.service";

// Fetch all shipping zones
export const fetchShippingZones = createAsyncThunk(
  "adminShipping/fetchShippingZones",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await shippingService.getAll(params);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to fetch shipping zones");
      }
      return response.data || response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch shipping zones"
      );
    }
  }
);

// Fetch single shipping zone
export const fetchShippingZoneById = createAsyncThunk(
  "adminShipping/fetchShippingZoneById",
  async (zoneId, { rejectWithValue }) => {
    try {
      const response = await shippingService.getById(zoneId);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to fetch shipping zone");
      }
      return response.data?.shippingZone || response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch shipping zone"
      );
    }
  }
);

// Create shipping zone
export const createShippingZone = createAsyncThunk(
  "adminShipping/createShippingZone",
  async (zoneData, { rejectWithValue }) => {
    try {
      const response = await shippingService.create(zoneData);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to create shipping zone");
      }
      return response.data?.shippingZone || response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to create shipping zone"
      );
    }
  }
);

// Update shipping zone
export const updateShippingZone = createAsyncThunk(
  "adminShipping/updateShippingZone",
  async ({ zoneId, zoneData }, { rejectWithValue }) => {
    try {
      const response = await shippingService.update(zoneId, zoneData);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to update shipping zone");
      }
      return response.data?.shippingZone || response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to update shipping zone"
      );
    }
  }
);

// Delete shipping zone
export const deleteShippingZone = createAsyncThunk(
  "adminShipping/deleteShippingZone",
  async (zoneId, { rejectWithValue }) => {
    try {
      const response = await shippingService.delete(zoneId);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to delete shipping zone");
      }
      return zoneId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to delete shipping zone"
      );
    }
  }
);

// Initial State
const initialState = {
  shippingZones: [],
  loading: false,
  actionLoading: false,
  error: null,
};

// Shipping Slice
const adminShippingSlice = createSlice({
  name: "adminShipping",
  initialState,
  reducers: {
    clearShippingError: (state) => {
      state.error = null;
    },
    resetShipping: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShippingZones.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShippingZones.fulfilled, (state, action) => {
        state.loading = false;
        state.shippingZones = action.payload?.shippingZones || action.payload || [];
      })
      .addCase(fetchShippingZones.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch shipping zones";
      })
      .addCase(createShippingZone.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createShippingZone.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.shippingZones.unshift(action.payload);
      })
      .addCase(createShippingZone.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create shipping zone";
      })
      .addCase(updateShippingZone.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateShippingZone.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.shippingZones.findIndex(
          (s) => s._id === action.payload._id
        );
        if (index !== -1) {
          state.shippingZones[index] = action.payload;
        }
      })
      .addCase(updateShippingZone.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update shipping zone";
      })
      .addCase(deleteShippingZone.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteShippingZone.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.shippingZones = state.shippingZones.filter(
          (s) => s._id !== action.payload
        );
      })
      .addCase(deleteShippingZone.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete shipping zone";
      });
  },
});

export const { clearShippingError, resetShipping } = adminShippingSlice.actions;

export default adminShippingSlice.reducer;