import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/**
 * =========================================
 * CREATE ADDRESS
 * =========================================
 */
export const createAddress = createAsyncThunk(
  "address/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/address", payload);
      return res.data.address;
    } catch {
      return rejectWithValue("Failed to create address");
    }
  }
);

/**
 * =========================================
 * FETCH USER ADDRESSES
 * =========================================
 */
export const fetchAddresses = createAsyncThunk(
  "address/fetch",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/address", {
        params: { userId },
      });
      return res.data.data;
    } catch {
      return rejectWithValue("Failed to fetch addresses");
    }
  }
);

/**
 * =========================================
 * UPDATE ADDRESS
 * =========================================
 */
export const updateAddress = createAsyncThunk(
  "address/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/api/address/${id}`, data);
      return res.data.address;
    } catch {
      return rejectWithValue("Failed to update address");
    }
  }
);

/**
 * =========================================
 * DELETE ADDRESS (SOFT)
 * =========================================
 */
export const deleteAddress = createAsyncThunk(
  "address/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/address/${id}`);
      return id;
    } catch {
      return rejectWithValue("Failed to delete address");
    }
  }
);

/**
 * =========================================
 * SET DEFAULT ADDRESS
 * =========================================
 */
export const setDefaultAddress = createAsyncThunk(
  "address/setDefault",
  async (id, { rejectWithValue }) => {
    try {
      await axios.patch(`/api/address/default/${id}`);
      return id;
    } catch {
      return rejectWithValue("Failed to set default");
    }
  }
);

/**
 * =========================================
 * SLICE
 * =========================================
 */
const addressSlice = createSlice({
  name: "address",

  initialState: {
    list: [],
    selected: null,

    loading: false,
    saving: false,

    error: null,
  },

  reducers: {
    clearSelectedAddress: (state) => {
      state.selected = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /**
       * FETCH
       */
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /**
       * CREATE
       */
      .addCase(createAddress.pending, (state) => {
        state.saving = true;
      })
      .addCase(createAddress.fulfilled, (state, action) => {
        state.saving = false;
        state.list.unshift(action.payload);
      })
      .addCase(createAddress.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      /**
       * UPDATE
       */
      .addCase(updateAddress.fulfilled, (state, action) => {
        const updated = action.payload;

        state.list = state.list.map((addr) =>
          addr._id === updated._id ? updated : addr
        );
      })

      /**
       * DELETE
       */
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.list = state.list.filter((addr) => addr._id !== action.payload);
      })

      /**
       * SET DEFAULT
       */
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        const id = action.payload;

        state.list = state.list.map((addr) => ({
          ...addr,
          isDefault: addr._id === id,
        }));
      });
  },
});

export const { clearSelectedAddress } = addressSlice.actions;
export default addressSlice.reducer;
