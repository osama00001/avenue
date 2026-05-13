import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/**
 * =============================
 * FETCH SOCIAL LINKS
 * =============================
 */
export const fetchSocialLinks = createAsyncThunk(
  "social/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/strapi/social");
      return (res.data.data || []).map((entry) => ({
        id: entry.id,
        ...(entry.attributes || {}),
      }));
    } catch (err) {
      try {
        const res = await axios.get("/api/myadmin/social");
        return res.data.data;
      } catch (fallbackErr) {
        return rejectWithValue(
          err.response?.data?.error || "Failed to load links"
        );
      }
    }
  }
);

/**
 * =============================
 * UPDATE SOCIAL LINKS
 * =============================
 */
export const updateSocialLinks = createAsyncThunk(
  "social/update",
  async (links, { rejectWithValue }) => {
    try {
      const res = await axios.put("/api/myadmin/social", { links });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Update failed");
    }
  }
);

/**
 * =============================
 * SLICE
 * =============================
 */
const socialSlice = createSlice({
  name: "social",

  initialState: {
    links: [],
    loading: false,
    saving: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder

      /**
       * FETCH
       */
      .addCase(fetchSocialLinks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSocialLinks.fulfilled, (state, action) => {
        state.loading = false;
        state.links = action.payload;
      })
      .addCase(fetchSocialLinks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /**
       * UPDATE
       */
      .addCase(updateSocialLinks.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateSocialLinks.fulfilled, (state, action) => {
        state.saving = false;
        state.links = action.payload;
      })
      .addCase(updateSocialLinks.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export default socialSlice.reducer;
