import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";

export const fetchDashboard = createAsyncThunk("admin/dashboard", async () => {
  const res = await api.get("/myadmin/dashboard");
  return res.data;
});

const slice = createSlice({
  name: "dashboard",
  initialState: {
    data: null,
    loading: false,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchDashboard.fulfilled, (s, a) => {
        s.loading = false;
        s.data = a.payload;
      })
      .addCase(fetchDashboard.rejected, (s) => {
        s.loading = false;
      });
  },
});

export default slice.reducer;
