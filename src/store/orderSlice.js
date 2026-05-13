import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/**
 * =========================================
 * PLACE COD ORDER
 * =========================================
 */
export const placeCODOrder = createAsyncThunk(
  "orders/placeCOD",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/orders/cod", payload);
      return res.data.order;
    } catch (err) {
      return rejectWithValue("Failed to place order");
    }
  }
);

/**
 * =========================================
 * FETCH USER ORDERS
 * =========================================
 */
export const fetchUserOrders = createAsyncThunk(
  "orders/fetchUser",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/orders/user/${userId}`);

      // console.log("-=--=- res ordersssssss -=-=-=-",res);
      return res.data.data;
    } catch (err) {
      return rejectWithValue("Failed to fetch orders");
    }
  }
);

/**
 * =========================================
 * FETCH SINGLE ORDER
 * =========================================
 */
export const fetchOrderDetails = createAsyncThunk(
  "orders/details",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/orders/${id}`);
      return res.data.order;
    } catch (err) {
      return rejectWithValue("Failed to fetch order");
    }
  }
);

/**
 * =========================================
 * SLICE
 * =========================================
 */
const orderSlice = createSlice({
  name: "orders",

  initialState: {
    list: [],
    userOrders: [],
    selectedOrder: null,

    page: 1,
    totalPages: 1,

    placing: false,
    loading: false,
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
       * PLACE ORDER
       */
      .addCase(placeCODOrder.pending, (state) => {
        state.placing = true;
        state.error = null;
      })
      .addCase(placeCODOrder.fulfilled, (state, action) => {
        state.placing = false;
        state.selectedOrder = action.payload;
      })
      .addCase(placeCODOrder.rejected, (state, action) => {
        state.placing = false;
        state.error = action.payload;
      })

      /**
       * USER ORDERS
       */
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.userOrders = action.payload;
      })

      /**
       * ORDER DETAILS
       */
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.selectedOrder = action.payload;
      });

    /**
     * ADMIN ORDERS
     */
  },
});

export const { clearSelectedOrder } = orderSlice.actions;
export default orderSlice.reducer;
