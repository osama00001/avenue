import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/**
 * =====================================================
 * FETCH CATEGORIES (ADMIN TABLE)
 * =====================================================
 */
export const fetchCategories = createAsyncThunk(
  "category/fetchAll",
  async (
    { page = 1, limit = 50, code = "", scheme = "" } = {},
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.get("/api/myadmin/category", {
        params: {
          page,
          limit,
          code,
          scheme,
        },
      });

      return res.data;
    } catch (err) {
      return rejectWithValue("Failed to fetch categories");
    }
  }
);

/**
 * =====================================================
 * FETCH CATEGORY BY ID + SCHEME (DETAIL PAGE)
 * =====================================================
 */
export const fetchCategoryById = createAsyncThunk(
  "category/fetchById",
  async ({ id, scheme }, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/myadmin/category/${id}`, {
        params: scheme ? { scheme } : {},
      });
      return res.data; // { category }
    } catch (err) {
      return rejectWithValue("Failed to fetch category details");
    }
  }
);

/**
 * =====================================================
 * UPDATE CATEGORY (headingText)
 * =====================================================
 */
export const updateCategory = createAsyncThunk(
  "category/update",
  async ({ id, scheme, headingText, status }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/api/myadmin/category/${id}`, {
        scheme,
        headingText,
        status,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue("Failed to update category");
    }
  }
);

/**
 * =====================================================
 * TOGGLE SCHEME STATUS (FAST / OPTIMISTIC)
 * =====================================================
 */
export const updateCategoryStatus = createAsyncThunk(
  "category/updateStatus",
  async ({ id, scheme, status }, { rejectWithValue }) => {
    try {
      await axios.patch(`/api/myadmin/category/${id}/status`, {
        scheme,
        status,
      });
      return { id, scheme, status };
    } catch (err) {
      return rejectWithValue("Failed to update status");
    }
  }
);

/**
 * =====================================================
 * DELETE SCHEME / CATEGORY (CASCADE)
 * =====================================================
 */
export const deleteCategory = createAsyncThunk(
  "category/delete",
  async ({ id, scheme }, { rejectWithValue }) => {
    try {
      const res = await axios.delete(`/api/myadmin/category/${id}`, {
        data: { scheme },
      });
      return { id, scheme, ...res.data }; // { deleted: "scheme" | "category" }
    } catch (err) {
      return rejectWithValue("Failed to delete category");
    }
  }
);

/**
 * =====================================================
 * SLICE
 * =====================================================
 */
const categorySlice = createSlice({
  name: "category",
  initialState: {
    list: [],

    // details page
    selectedCategory: null,
    selectedLoading: false,
    selectedError: null,

    // pagination
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
       * ========================
       * FETCH LIST
       * ========================
       */
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;

        state.list = action.payload.data || [];
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
      })

      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /**
       * ========================
       * FETCH CATEGORY BY ID
       * ========================
       */
      .addCase(fetchCategoryById.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })

      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selectedCategory = action.payload?.category || null;
      })

      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.payload;
      })

      /**
       * ========================
       * UPDATE HEADING TEXT
       * ========================
       */
      .addCase(updateCategory.fulfilled, (state, action) => {
        const updated = action.payload;

        // update table
        state.list = state.list.map((row) =>
          row._id === updated._id && row.scheme === updated.scheme
            ? { ...row, ...updated }
            : row
        );

        // update details page
        if (
          state.selectedCategory &&
          state.selectedCategory._id === updated._id &&
          state.selectedCategory.scheme === updated.scheme
        ) {
          state.selectedCategory = {
            ...state.selectedCategory,
            ...updated,
          };
        }
      })

      /**
       * ========================
       * TOGGLE STATUS (OPTIMISTIC)
       * ========================
       */
      .addCase(updateCategoryStatus.pending, (state, action) => {
        const { id, scheme, status } = action.meta.arg;

        const row = state.list.find((r) => r._id === id && r.scheme === scheme);
        if (row) row.status = status;

        if (
          state.selectedCategory &&
          state.selectedCategory._id === id &&
          state.selectedCategory.scheme === scheme
        ) {
          state.selectedCategory.status = status;
        }
      })

      .addCase(updateCategoryStatus.rejected, (state, action) => {
        state.error = action.payload;
      })

      /**
       * ========================
       * DELETE (SCHEME / CATEGORY)
       * ========================
       */
      .addCase(deleteCategory.fulfilled, (state, action) => {
        const { id, scheme, deleted } = action.payload;

        if (deleted === "scheme") {
          state.list = state.list.filter(
            (row) => !(row._id === id && row.scheme === scheme)
          );
        }

        if (deleted === "category") {
          state.list = state.list.filter((row) => row._id !== id);
        }

        if (
          state.selectedCategory &&
          state.selectedCategory._id === id &&
          state.selectedCategory.scheme === scheme
        ) {
          state.selectedCategory = null;
        }
      });
  },
});

export default categorySlice.reducer;
