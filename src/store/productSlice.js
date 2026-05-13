import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/**
 * ======================================
 * FETCH BOOKS (ADMIN)
 * ======================================
 */
export const fetchAdminProductBooks = createAsyncThunk(
  "adminBooks/fetch",
  async ({ page = 1, limit = 50, search = "" } = {}, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/myadmin/products", {
        params: { page, limit, search },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue("Failed to fetch books");
    }
  }
);

export const updateAdminBookStatus = createAsyncThunk(
  "adminBooks/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await axios.patch("/api/myadmin/products/status", {
        id,
        status,
      });

      console.log("-=-=- response in the updateAdminStatus -=-=-", res);

      return {
        id,
        status,
      };
    } catch (err) {
      return rejectWithValue("Failed to update status");
    }
  }
);

/**
 * ======================================
 * FETCH BOOK DETAILS
 * ======================================
 */
export const fetchAdminBookDetails = createAsyncThunk(
  "adminBooks/details",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/myadmin/products/${id}`);

      // console.log("-=-=-- fetchAdminBookDetails response data -=-=-=--=-", res?.data?.data);
      return res?.data?.data; // <- matches controller response
    } catch (err) {
      return rejectWithValue("Failed to fetch book details");
    }
  }
);

/**
 * ======================================
 * UPDATE BOOK (ADMIN)
 * ======================================
 */
export const updateAdminBookProduct = createAsyncThunk(
  "adminBooks/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await axios.put("/api/myadmin/products", {
        id,
        data,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue("Failed to update book");
    }
  }
);

/**
 * ======================================
 * DELETE BOOK (ADMIN)
 * ======================================
 */
export const deleteAdminBookProduct = createAsyncThunk(
  "adminBooks/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete("/api/myadmin/products", {
        data: { id },
      });
      return id;
    } catch (err) {
      return rejectWithValue("Failed to delete book");
    }
  }
);

/**
 * ======================================
 * SLICE
 * ======================================
 */
const adminBookSlice = createSlice({
  name: "adminBooks",
  initialState: {
    list: [],
    selectedBook: {}, // ⭐ ADD THIS
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,

    loading: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder

      /**
       * ======================
       * FETCH
       * ======================
       */
      .addCase(fetchAdminProductBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchAdminProductBooks.fulfilled, (state, action) => {
        state.loading = false;

        state.list = action.payload.data || [];
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
      })

      .addCase(fetchAdminProductBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /**
       * ======================
       * UPDATE
       * ======================
       */
      .addCase(updateAdminBookProduct.fulfilled, (state, action) => {
        const updated = action.payload;

        state.list = state.list.map((book) =>
          book._id === updated._id ? updated : book
        );
      })
      /**
       * ======================
       * FETCH DETAILS
       * ======================
       */
      .addCase(fetchAdminBookDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchAdminBookDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedBook = action.payload;
      })

      .addCase(fetchAdminBookDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /**
       * ======================
       * DELETE
       * ======================
       */
      .addCase(deleteAdminBookProduct.fulfilled, (state, action) => {
        const id = action.payload;

        state.list = state.list.filter((book) => book._id !== id);
        state.total -= 1;
      })
      .addCase(updateAdminBookStatus.pending, (state) => {
        state.updating = true;
      })

      .addCase(updateAdminBookStatus.fulfilled, (state, action) => {
        state.updating = false;

        const { id, status } = action.payload;

        const book = state.list.find((b) => b._id === id);

        if (book) {
          book.status = status;
        }
      })

      .addCase(updateAdminBookStatus.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      });
  },
});

export default adminBookSlice.reducer;
