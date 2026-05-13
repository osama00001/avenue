import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/**
 * ======================================================
 * FETCH ADMIN ORDERS (TABLE)
 * ======================================================
 */
export const fetchAdminOrders = createAsyncThunk(
  "adminOrders/fetch",
  async (
    { page = 1, limit = 50, search = "", status = "" } = {},
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.get("/api/myadmin/orders", {
        params: { page, limit, search, status },
      });

      return res.data;
    } catch (err) {
      return rejectWithValue("Failed to fetch orders");
    }
  }
);

/**
 * ======================================================
 * FETCH SINGLE ORDER
 * ======================================================
 */
export const fetchAdminOrderDetails = createAsyncThunk(
  "adminOrders/details",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/orders/${id}`);
      return res.data.order;
    } catch {
      return rejectWithValue("Failed to fetch order details");
    }
  }
);

/**
 * ======================================================
 * UPDATE ORDER STATUS
 * ======================================================
 */
export const updateAdminOrderStatus = createAsyncThunk(
  "adminOrders/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await axios.patch("/api/myadmin/orders/status", {
        id,
        status,
      });

      return res.data.order;
    } catch {
      return rejectWithValue("Failed to update status");
    }
  }
);

/**
 * ======================================================
 * SLICE
 * ======================================================
 */
const adminOrderSlice = createSlice({
  name: "adminOrders",

  initialState: {
    list: [],
    selectedOrder: null,

    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,

    loading: false,
    updating: false,
    error: null,
  },

  reducers: {
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /**
       * ===============================
       * FETCH LIST
       * ===============================
       */
      .addCase(fetchAdminOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.loading = false;

        state.list = action.payload.data;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
      })

      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /**
       * ===============================
       * FETCH SINGLE ORDER
       * ===============================
       */
      .addCase(fetchAdminOrderDetails.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchAdminOrderDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
      })

      .addCase(fetchAdminOrderDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /**
       * ===============================
       * UPDATE STATUS
       * ===============================
       */
      .addCase(updateAdminOrderStatus.pending, (state) => {
        state.updating = true;
      })

      .addCase(updateAdminOrderStatus.fulfilled, (state, action) => {
        state.updating = false;

        const updated = action.payload;

        // Update list
        const index = state.list.findIndex((o) => o._id === updated._id);

        if (index !== -1) {
          state.list[index] = updated;
        }

        // Update selected
        if (state.selectedOrder?._id === updated._id) {
          state.selectedOrder = updated;
        }
      })

      .addCase(updateAdminOrderStatus.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedOrder } = adminOrderSlice.actions;
export default adminOrderSlice.reducer;
