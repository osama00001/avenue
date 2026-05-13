import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchNavigation = createAsyncThunk(
  "navigation/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/strapi/navigation");
      const entry = res.data.data;
      return entry
        ? {
            id: entry.id,
            ...(entry.attributes || {}),
          }
        : null;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || "Failed to load navigation"
      );
    }
  }
);

const navigationSlice = createSlice({
  name: "navigation",
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNavigation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNavigation.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchNavigation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default navigationSlice.reducer;
