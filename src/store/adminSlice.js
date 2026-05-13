import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";

/**
 * ===============================
 * FETCH ADMIN PROFILE
 * ===============================
 */
export const fetchAdminProfile = createAsyncThunk(
  "admin/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/myadmin/profile");

      // backend returns { data: user }
      return response.data.data;
    } catch (err) {
      return rejectWithValue("Failed to load profile");
    }
  }
);

/**
 * ===============================
 * UPDATE ADMIN PROFILE
 * ===============================
 */
export const updateAdminProfile = createAsyncThunk(
  "admin/updateProfile",
  async (formValues, { rejectWithValue }) => {
    try {
      const response = await api.put("/myadmin/profile", formValues);
      return response.data.data;
    } catch (err) {
      return rejectWithValue("Update failed");
    }
  }
);

/**
 * ===============================
 * SLICE
 * ===============================
 */
const adminSlice = createSlice({
  name: "admin",

  initialState: {
    id: "",
    name: "",
    username: "",
    email: "",
    role: "",
    loading: false,
    error: null,
  },

  reducers: {
    clearAdmin: (state) => {
      state.id = "";
      state.name = "";
      state.username = "";
      state.email = "";
      state.role = "";
    },
  },

  extraReducers: (builder) => {
    builder

      /**
       * FETCH PROFILE
       */
      .addCase(fetchAdminProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchAdminProfile.fulfilled, (state, action) => {
        state.loading = false;

        const user = action.payload;

        state.id = user._id;
        state.name = user.name || "";
        state.username = user.username || "";
        state.email = user.email || "";
        state.role = user.role || "";
      })

      .addCase(fetchAdminProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /**
       * UPDATE PROFILE
       */
      .addCase(updateAdminProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(updateAdminProfile.fulfilled, (state, action) => {
        state.loading = false;

        const user = action.payload;

        // Update local state
        state.name = user.name;
        state.username = user.username;
        state.email = user.email;
      })

      .addCase(updateAdminProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdmin } = adminSlice.actions;
export default adminSlice.reducer;
