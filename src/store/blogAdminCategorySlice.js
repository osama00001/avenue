import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/**
 * ==============================
 * FETCH
 * ==============================
 */
export const fetchAdminBlogCategories = createAsyncThunk(
  "blogCategory/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/myadmin/blog-categories");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || "Failed to fetch categories"
      );
    }
  }
);

/**
 * ==============================
 * CREATE
 * ==============================
 */
export const createAdminBlogCategory = createAsyncThunk(
  "blogCategory/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/myadmin/blog-categories", payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Create failed");
    }
  }
);

/**
 * ==============================
 * UPDATE
 * ==============================
 */
export const updateAdminBlogCategory = createAsyncThunk(
  "blogCategory/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/api/myadmin/blog-categories/${id}`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Update failed");
    }
  }
);

/**
 * ==============================
 * DELETE
 * ==============================
 */
export const deleteAdminBlogCategory = createAsyncThunk(
  "blogCategory/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/myadmin/blog-categories/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Delete failed");
    }
  }
);

/**
 * ==============================
 * SLICE
 * ==============================
 */
const slice = createSlice({
  name: "blogCategory",

  initialState: {
    list: [],
    loading: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder

      // FETCH
      .addCase(fetchAdminBlogCategories.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchAdminBlogCategories.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload;
      })
      .addCase(fetchAdminBlogCategories.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })

      // CREATE
      .addCase(createAdminBlogCategory.fulfilled, (s, a) => {
        s.list.unshift(a.payload);
      })

      // UPDATE
      .addCase(updateAdminBlogCategory.fulfilled, (s, a) => {
        const i = s.list.findIndex((x) => x._id === a.payload._id);
        if (i !== -1) s.list[i] = a.payload;
      })

      // DELETE
      .addCase(deleteAdminBlogCategory.fulfilled, (s, a) => {
        s.list = s.list.filter((c) => c._id !== a.payload);
      });
  },
});

export default slice.reducer;
