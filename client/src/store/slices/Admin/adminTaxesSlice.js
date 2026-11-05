import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import taxService from "../../../services/tax.service";

// Fetch all taxes
export const fetchTaxes = createAsyncThunk(
  "adminTaxes/fetchTaxes",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await taxService.getAll(params);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to fetch taxes");
      }
      return response.data || response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch taxes"
      );
    }
  }
);

// Fetch single tax
export const fetchTaxById = createAsyncThunk(
  "adminTaxes/fetchTaxById",
  async (taxId, { rejectWithValue }) => {
    try {
      const response = await taxService.getById(taxId);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to fetch tax");
      }
      return response.data?.tax || response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch tax"
      );
    }
  }
);

// Create tax
export const createTax = createAsyncThunk(
  "adminTaxes/createTax",
  async (taxData, { rejectWithValue }) => {
    try {
      const response = await taxService.create(taxData);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to create tax");
      }
      return response.data?.tax || response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to create tax"
      );
    }
  }
);

// Update tax
export const updateTax = createAsyncThunk(
  "adminTaxes/updateTax",
  async ({ taxId, taxData }, { rejectWithValue }) => {
    try {
      const response = await taxService.update(taxId, taxData);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to update tax");
      }
      return response.data?.tax || response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to update tax"
      );
    }
  }
);

// Delete tax
export const deleteTax = createAsyncThunk(
  "adminTaxes/deleteTax",
  async (taxId, { rejectWithValue }) => {
    try {
      const response = await taxService.delete(taxId);
      if (response?.success === false) {
        return rejectWithValue(response.message || "Failed to delete tax");
      }
      return taxId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to delete tax"
      );
    }
  }
);

// Initial State
const initialState = {
  taxes: [],
  loading: false,
  actionLoading: false,
  error: null,
};

// Taxes Slice
const adminTaxesSlice = createSlice({
  name: "adminTaxes",
  initialState,
  reducers: {
    clearTaxesError: (state) => {
      state.error = null;
    },
    resetTaxes: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaxes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaxes.fulfilled, (state, action) => {
        state.loading = false;
        state.taxes = action.payload?.taxes || action.payload || [];
      })
      .addCase(fetchTaxes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch taxes";
      })
      .addCase(createTax.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createTax.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.taxes.unshift(action.payload);
      })
      .addCase(createTax.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create tax";
      })
      .addCase(updateTax.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateTax.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.taxes.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.taxes[index] = action.payload;
        }
      })
      .addCase(updateTax.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update tax";
      })
      .addCase(deleteTax.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteTax.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.taxes = state.taxes.filter((t) => t._id !== action.payload);
      })
      .addCase(deleteTax.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete tax";
      });
  },
});

export const { clearTaxesError, resetTaxes } = adminTaxesSlice.actions;

export default adminTaxesSlice.reducer;