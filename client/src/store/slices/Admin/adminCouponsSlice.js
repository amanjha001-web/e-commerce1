import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import couponService from "../../../services/coupon.service";

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong";

// Fetch all coupons (GET /admin/coupons)
export const fetchCoupons = createAsyncThunk(
  "adminCoupons/fetchCoupons",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await couponService.getAdminCoupons(params);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to fetch coupons");
      }
      const data = response?.data ?? response;
      return {
        coupons: Array.isArray(data?.coupons)
          ? data.coupons
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

// Fetch coupon by ID (GET /admin/coupons/:id)
export const fetchCouponById = createAsyncThunk(
  "adminCoupons/fetchCouponById",
  async (couponId, { rejectWithValue }) => {
    try {
      const response = await couponService.getCouponById(couponId);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to fetch coupon");
      }
      return response?.data?.coupon ?? response?.data ?? response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// Create coupon (POST /admin/coupons)
export const createCoupon = createAsyncThunk(
  "adminCoupons/createCoupon",
  async (couponData, { rejectWithValue }) => {
    try {
      const response = await couponService.createCoupon(couponData);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to create coupon");
      }
      return response?.data?.coupon ?? response?.data ?? response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// Update coupon (PATCH /admin/coupons/:id)
export const updateCoupon = createAsyncThunk(
  "adminCoupons/updateCoupon",
  async ({ couponId, couponData }, { rejectWithValue }) => {
    try {
      const response = await couponService.updateCoupon(couponId, couponData);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to update coupon");
      }
      return response?.data?.coupon ?? response?.data ?? response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// Delete coupon (DELETE /admin/coupons/:id)
export const deleteCoupon = createAsyncThunk(
  "adminCoupons/deleteCoupon",
  async (couponId, { rejectWithValue }) => {
    try {
      const response = await couponService.deleteCoupon(couponId);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to delete coupon");
      }
      return couponId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// Toggle coupon status (PATCH /admin/coupons/:id/status)
export const toggleCouponStatus = createAsyncThunk(
  "adminCoupons/toggleStatus",
  async (arg, { getState, rejectWithValue }) => {
    try {
      const couponId = typeof arg === "object" ? arg.couponId : arg;
      let isActive = typeof arg === "object" ? arg.isActive : undefined;

      if (typeof isActive !== "boolean") {
        const existing = getState()?.adminCoupons?.coupons?.find(
          (c) => (c._id || c.id) === couponId,
        );
        isActive = !(existing?.isActive ?? existing?.status ?? true);
      }

      const response = await couponService.toggleCouponStatus(
        couponId,
        isActive,
      );
      if (response?.success === false) {
        return rejectWithValue(
          response.message || "Failed to toggle coupon status",
        );
      }
      return {
        couponId,
        coupon: response?.data?.coupon ?? response?.data ?? null,
        isActive,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// Fetch coupon usage stats (GET /admin/coupons/:id/usage)
export const fetchCouponUsage = createAsyncThunk(
  "adminCoupons/fetchCouponUsage",
  async (couponId, { rejectWithValue }) => {
    try {
      const response = await couponService.getCouponUsage(couponId);
      if (response?.success === false) {
        return rejectWithValue(
          response.message || "Failed to fetch coupon usage",
        );
      }
      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const initialState = {
  coupons: [],
  selectedCoupon: null,
  couponUsage: null,
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

const adminCouponsSlice = createSlice({
  name: "adminCoupons",
  initialState,
  reducers: {
    clearAdminCouponsError: (state) => {
      state.error = null;
    },
    setAdminCouponsPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    clearSelectedCoupon: (state) => {
      state.selectedCoupon = null;
      state.couponUsage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload?.coupons || [];
        state.pagination = action.payload?.pagination || {};
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch coupons";
      })
      .addCase(fetchCouponById.fulfilled, (state, action) => {
        state.selectedCoupon = action.payload;
      })
      .addCase(fetchCouponUsage.fulfilled, (state, action) => {
        state.couponUsage = action.payload;
      })
      .addCase(createCoupon.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.saving = false;
        if (action.payload) {
          state.coupons.unshift(action.payload);
        }
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to create coupon";
      })
      .addCase(updateCoupon.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.saving = false;
        const index = state.coupons.findIndex(
          (c) => (c._id || c.id) === (action.payload?._id || action.payload?.id),
        );
        if (index !== -1) {
          state.coupons[index] = action.payload;
        }
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to update coupon";
      })
      .addCase(deleteCoupon.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.saving = false;
        state.coupons = state.coupons.filter(
          (c) => (c._id || c.id) !== action.payload,
        );
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to delete coupon";
      })
      .addCase(toggleCouponStatus.fulfilled, (state, action) => {
        const { couponId, coupon, isActive } = action.payload;
        const index = state.coupons.findIndex(
          (c) => (c._id || c.id) === couponId,
        );
        if (index !== -1) {
          state.coupons[index] = coupon
            ? { ...state.coupons[index], ...coupon }
            : {
                ...state.coupons[index],
                isActive,
                status: isActive,
              };
        }
      });
  },
});

export const {
  clearAdminCouponsError,
  setAdminCouponsPage,
  clearSelectedCoupon,
} = adminCouponsSlice.actions;

export default adminCouponsSlice.reducer;
