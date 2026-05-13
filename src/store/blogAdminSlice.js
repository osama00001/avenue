import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/**
 * =============================
 * FETCH ALL BLOGS
 * =============================
 */
export const fetchAdminBlogs = createAsyncThunk(
  "blog/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/myadmin/blogs");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Fetch blogs failed");
    }
  }
);

/**
 * =============================
 * FETCH SINGLE BLOG
 * =============================
 */
export const fetchAdminBlogDetails = createAsyncThunk(
  "blog/details",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/myadmin/blogs/${id}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Fetch blog failed");
    }
  }
);

/**
 * =============================
 * CREATE BLOG
 * =============================
 */
export const createAdminBlog = createAsyncThunk(
  "blog/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/myadmin/blogs", payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Create failed");
    }
  }
);

/**
 * =============================
 * UPDATE BLOG
 * =============================
 */
export const updateAdminBlog = createAsyncThunk(
  "blog/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/api/myadmin/blogs/${id}`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Update failed");
    }
  }
);

/**
 * =============================
 * DELETE BLOG
 * =============================
 */
export const deleteAdminBlog = createAsyncThunk(
  "blog/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/myadmin/blogs/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Delete failed");
    }
  }
);

/**
 * =============================
 * SLICE
 * =============================
 */
const slice = createSlice({
  name: "blog",

  initialState: {
    list: [],
    selected: null,
    loading: false,
    error: null,
  },

  reducers: {
    clearSelectedBlog: (s) => {
      s.selected = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // FETCH ALL
      .addCase(fetchAdminBlogs.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchAdminBlogs.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload;
      })
      .addCase(fetchAdminBlogs.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })

      // DETAILS
      .addCase(fetchAdminBlogDetails.fulfilled, (s, a) => {
        s.selected = a.payload;
      })

      // CREATE
      .addCase(createAdminBlog.fulfilled, (s, a) => {
        s.list.unshift(a.payload);
      })

      // UPDATE
      .addCase(updateAdminBlog.fulfilled, (s, a) => {
        const i = s.list.findIndex((x) => x._id === a.payload._id);
        if (i !== -1) s.list[i] = a.payload;
      })

      // DELETE
      .addCase(deleteAdminBlog.fulfilled, (s, a) => {
        s.list = s.list.filter((b) => b._id !== a.payload);
      });
  },
});

export const { clearSelectedBlog } = slice.actions;
export default slice.reducer;
