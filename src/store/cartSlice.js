import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";

/**
 * =====================================================
 * INTERNAL HELPER
 * Handles both response shapes:
 * { items }
 * { cart: { items } }
 * =====================================================
 */
const extractItems = (res) => res?.data?.items || res?.data?.cart?.items || [];

/**
 * =====================================================
 * FETCH CART
 * =====================================================
 */
export const fetchCart = createAsyncThunk(
  "cart/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/cart");
      return extractItems(res);
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch cart");
    }
  }
);

/**
 * =====================================================
 * ADD TO CART
 * =====================================================
 */
export const addToCart = createAsyncThunk(
  "cart/add",
  async ({ bookId, quantity = 1, ebookFormat = null }, { rejectWithValue }) => {
    try {
      const res = await api.post("/cart", {
        bookId,
        quantity,
        ebookFormat,
      });
      return extractItems(res);
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to add item");
    }
  }
);

/**
 * =====================================================
 * UPDATE QUANTITY
 * =====================================================
 */
export const updateCartQuantity = createAsyncThunk(
  "cart/update",
  async ({ bookId, quantity, ebookFormat = null }, { rejectWithValue }) => {
    try {
      const res = await api.put("/cart", {
        bookId,
        quantity,
        ebookFormat,
      });
      return extractItems(res);
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to update quantity");
    }
  }
);

/**
 * =====================================================
 * REMOVE FROM CART
 * =====================================================
 */
export const removeFromCart = createAsyncThunk(
  "cart/remove",
  async ({ bookId, ebookFormat = null }, { rejectWithValue }) => {
    try {
      const res = await api.delete("/cart", {
        // data: { bookId, ebookFormat },
        data: { bookId },
      });
      return extractItems(res);
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to remove item");
    }
  }
);

/**
 * =====================================================
 * MERGE GUEST CART INTO USER CART
 * (called after login)
 * =====================================================
 */
export const mergeCart = createAsyncThunk(
  "cart/merge",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/cart/merge");
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to merge cart");
    }
  }
);

/**
 * =====================================================
 * SLICE
 * =====================================================
 */
const cartSlice = createSlice({
  name: "cart",

  initialState: {
    items: [],
    loading: false,
    syncing: false,
    error: null,
  },

  reducers: {
    clearCart(state) {
      state.items = [];
    },
  },

  extraReducers: (builder) => {
    builder

      /**
       * FETCH CART
       */
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /**
       * ADD ITEM
       */
      .addCase(addToCart.pending, (state) => {
        state.syncing = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.syncing = false;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload;
      })

      /**
       * UPDATE QTY
       */
      .addCase(updateCartQuantity.pending, (state) => {
        state.syncing = true;
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        state.items = action.payload;
        state.syncing = false;
      })
      .addCase(updateCartQuantity.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload;
      })

      /**
       * REMOVE ITEM
       */
      .addCase(removeFromCart.pending, (state) => {
        state.syncing = true;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.syncing = false;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload;
      })

      /**
       * MERGE CART
       */
      .addCase(mergeCart.pending, (state) => {
        state.syncing = true;
      })
      .addCase(mergeCart.fulfilled, (state) => {
        state.syncing = false;
      })
      .addCase(mergeCart.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload;
      });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
