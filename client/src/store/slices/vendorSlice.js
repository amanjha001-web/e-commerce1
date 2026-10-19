
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import vendorService from "../../services/vendor.service";

// Fetch the logged-in vendor's profile.
// Pass the actual vendor document ID when dispatching.
export const fetchVendorProfile = createAsyncThunk(
  "vendor/fetchProfile",
  async (vendorId, { rejectWithValue }) => {
    try {
      if (!vendorId) {
        return rejectWithValue("Vendor ID is required.");
      }

      const response = await vendorService.getVendorById(vendorId);

      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Unable to load vendor profile."
      );
    }
  }
);

// Update the vendor's profile.
// Dispatch with { vendorId, data }.
export const updateVendorProfile = createAsyncThunk(
  "vendor/updateProfile",
  async ({ vendorId, data }, { rejectWithValue }) => {
    try {
      if (!vendorId) {
        return rejectWithValue("Vendor ID is required.");
      }

      const response = await vendorService.updateProfile(
        vendorId,
        data
      );

      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Profile update failed."
      );
    }
  }
);

const initialState = {
  profile: null,
  loading: false,
  savingProfile: false,
  error: null,
  successMessage: null,
};

const vendorSlice = createSlice({
  name: "vendor",
  initialState,

  reducers: {
    clearVendorMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchVendorProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendorProfile.fulfilled, (state, action) => {
        state.loading = false;

        // Support APIs that return { vendor: {...} }
        // as well as APIs that return the vendor object directly.
        state.profile =
          action.payload?.vendor ?? action.payload?.data ?? action.payload;
      })
      .addCase(fetchVendorProfile.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ||
          action.error.message ||
          "Unable to load vendor profile.";
      })

      // Update profile
      .addCase(updateVendorProfile.pending, (state) => {
        state.savingProfile = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateVendorProfile.fulfilled, (state, action) => {
        state.savingProfile = false;

        const updated =
          action.payload?.vendor ?? action.payload?.data ?? action.payload;

        if (updated && typeof updated === "object") {
          state.profile = {
            ...state.profile,
            ...updated,
          };
        }

        state.successMessage = "Profile updated successfully.";
      })
      .addCase(updateVendorProfile.rejected, (state, action) => {
        state.savingProfile = false;
        state.error =
          action.payload || "Profile update failed.";
      });
  },
});

export const { clearVendorMessages } = vendorSlice.actions;

export default vendorSlice.reducer;
