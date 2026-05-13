import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/**
 * =====================================
 * FETCH BLOG LIST
 * =====================================
 */
export const fetchBlogs = createAsyncThunk(
  "blog/fetchBlogs",
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await axios.get(`/api/blog?${query}`);

    //   console.log("-==-=--=-=-= response in the feth vlogs  --=--=--=-=-", res); 
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || "Failed to load blogs"
      );
    }
  }
);

/**
 * =====================================
 * FETCH SINGLE BLOG
 * =====================================
 */
export const fetchBlogBySlug = createAsyncThunk(
  "blog/fetchBlogBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/blog/${slug}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || "Failed to load blog"
      );
    }
  }
);

/**
 * =====================================
 * FETCH BLOG CATEGORIES
 * =====================================
 */
export const fetchBlogCategories = createAsyncThunk(
  "blog/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/blog/categories");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || "Failed to load categories"
      );
    }
  }
);

/**
 * =====================================
 * SLICE
 * =====================================
 */
const blogSlice = createSlice({
  name: "blog",

  initialState: {
    list: [],
    selected: null,
    categories: [],

    loading: false,
    detailLoading: false,
    categoryLoading: false,

    error: null,
  },

  reducers: {
    clearSelectedBlog: (state) => {
      state.selected = null;
    },

    clearBlogError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /**
       * ================= BLOG LIST
       */
      .addCase(fetchBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /**
       * ================= BLOG DETAILS
       */
      .addCase(fetchBlogBySlug.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchBlogBySlug.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchBlogBySlug.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })

      /**
       * ================= CATEGORIES
       */
      .addCase(fetchBlogCategories.pending, (state) => {
        state.categoryLoading = true;
      })
      .addCase(fetchBlogCategories.fulfilled, (state, action) => {
        state.categoryLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchBlogCategories.rejected, (state, action) => {
        state.categoryLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedBlog, clearBlogError } = blogSlice.actions;
export default blogSlice.reducer;
