import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import couponService from "../../../services/coupon.service";

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong";

// Fetch all coupons
export const fetchCoupons = createAsyncThunk(
  "adminCoupons/fetchCoupons",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await couponService.getAdminCoupons(params);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to fetch coupons");
      }
      return {
        coupons: Array.isArray(response.data?.coupons)
          ? response.data.coupons
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

// Create coupon
export const createCoupon = createAsyncThunk(
  "adminCoupons/createCoupon",
  async (couponData, { rejectWithValue }) => {
    try {
      const response = await couponService.createCoupon(couponData);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to create coupon");
      }
      return response.data?.coupon || response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Update coupon
export const updateCoupon = createAsyncThunk(
  "adminCoupons/updateCoupon",
  async ({ couponId, couponData }, { rejectWithValue }) => {
    try {
      const response = await couponService.updateCoupon(couponId, couponData);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to update coupon");
      }
      return response.data?.coupon || response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Delete coupon
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
  }
);

// Toggle coupon status
export const toggleCouponStatus = createAsyncThunk(
  "adminCoupons/toggleStatus",
  async (couponId, { rejectWithValue }) => {
    try {
      const response = await couponService.toggleCouponStatus(couponId);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to toggle coupon status");
      }
      return couponId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  coupons: [],
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
      .addCase(createCoupon.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.saving = false;
        state.coupons.unshift(action.payload);
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
          (c) => c._id === action.payload._id
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
        state.coupons = state.coupons.filter((c) => c._id !== action.payload);
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to delete coupon";
      })
      .addCase(toggleCouponStatus.fulfilled, (state, action) => {
        const index = state.coupons.findIndex(
          (c) => c._id === action.payload
        );
        if (index !== -1) {
          state.coupons[index] = {
            ...state.coupons[index],
            status: !state.coupons[index].status,
          };
        }
      });
  },
});

export const { clearAdminCouponsError, setAdminCouponsPage } =
  adminCouponsSlice.actions;

export default adminCouponsSlice.reducer;