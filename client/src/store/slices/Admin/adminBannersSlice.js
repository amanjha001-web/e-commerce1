import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import bannersService from "../../../services/banners.service";

// Fetch all banners (GET /banners)
export const fetchBanners = createAsyncThunk(
  "adminBanners/fetchBanners",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await bannersService.getAll(params);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to fetch banners");
      }
      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch banners",
      );
    }
  },
);

// Fetch single banner (GET /banners/:bannerId)
export const fetchBannerById = createAsyncThunk(
  "adminBanners/fetchBannerById",
  async (bannerId, { rejectWithValue }) => {
    try {
      const response = await bannersService.getById(bannerId);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to fetch banner");
      }
      return response?.data?.banner ?? response?.data ?? response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch banner",
      );
    }
  },
);

// Create banner (POST /banners)
export const createBanner = createAsyncThunk(
  "adminBanners/createBanner",
  async (bannerData, { rejectWithValue }) => {
    try {
      const response = await bannersService.create(bannerData);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to create banner");
      }
      return response?.data?.banner ?? response?.data ?? response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to create banner",
      );
    }
  },
);

// Update banner (PATCH /banners/:bannerId)
export const updateBanner = createAsyncThunk(
  "adminBanners/updateBanner",
  async ({ bannerId, bannerData }, { rejectWithValue }) => {
    try {
      const response = await bannersService.update(bannerId, bannerData);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to update banner");
      }
      return response?.data?.banner ?? response?.data ?? response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update banner",
      );
    }
  },
);

// Delete banner (DELETE /banners/:bannerId)
export const deleteBanner = createAsyncThunk(
  "adminBanners/deleteBanner",
  async (bannerId, { rejectWithValue }) => {
    try {
      const response = await bannersService.delete(bannerId);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to delete banner");
      }
      return bannerId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete banner",
      );
    }
  },
);

// Toggle banner status (PATCH /banners/:bannerId with status: ACTIVE | INACTIVE)
export const toggleBannerStatus = createAsyncThunk(
  "adminBanners/toggleBannerStatus",
  async (arg, { getState, rejectWithValue }) => {
    try {
      const bannerId = typeof arg === "object" ? arg.bannerId : arg;
      let nextStatus = typeof arg === "object" ? arg.status : undefined;

      if (!nextStatus) {
        const existing = getState()?.adminBanners?.banners?.find(
          (b) => (b._id || b.id) === bannerId,
        );
        const current = String(existing?.status || "ACTIVE").toUpperCase();
        nextStatus = current === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      }

      const response = await bannersService.update(bannerId, {
        status: nextStatus,
      });
      if (response?.success === false) {
        return rejectWithValue(
          response.message || "Failed to toggle banner status",
        );
      }
      return response?.data?.banner ?? response?.data ?? response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to toggle banner status",
      );
    }
  },
);

const initialState = {
  banners: [],
  selectedBanner: null,
  pagination: {},
  stats: null,
  loading: false,
  actionLoading: false,
  error: null,
};

const adminBannersSlice = createSlice({
  name: "adminBanners",
  initialState,
  reducers: {
    clearBannersError: (state) => {
      state.error = null;
    },
    resetBanners: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        state.banners = Array.isArray(payload?.banners)
          ? payload.banners
          : Array.isArray(payload?.docs)
            ? payload.docs
            : Array.isArray(payload)
              ? payload
              : [];
        state.pagination = payload?.pagination || {};
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch banners";
      })
      .addCase(toggleBannerStatus.fulfilled, (state, action) => {
        const index = state.banners.findIndex(
          (b) => (b._id || b.id) === (action.payload?._id || action.payload?.id),
        );
        if (index !== -1) {
          state.banners[index] = action.payload;
        }
      })
      .addCase(fetchBannerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBannerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedBanner = action.payload;
      })
      .addCase(fetchBannerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch banner";
      })
      .addCase(createBanner.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createBanner.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          state.banners.unshift(action.payload);
        }
      })
      .addCase(createBanner.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create banner";
      })
      .addCase(updateBanner.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateBanner.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.banners.findIndex(
          (b) => (b._id || b.id) === (action.payload?._id || action.payload?.id),
        );
        if (index !== -1) {
          state.banners[index] = action.payload;
        }
      })
      .addCase(updateBanner.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update banner";
      })
      .addCase(deleteBanner.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.banners = state.banners.filter(
          (b) => (b._id || b.id) !== action.payload,
        );
      })
      .addCase(deleteBanner.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete banner";
      });
  },
});

export const { clearBannersError, resetBanners } = adminBannersSlice.actions;

export default adminBannersSlice.reducer;
