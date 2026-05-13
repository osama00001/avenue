import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ======================================================
// FETCH USERS (LIST)
// ======================================================

export const fetchAdminUsers = createAsyncThunk(
  "adminUsers/fetch",
  async ({ page = 1, limit = 50, search = "" } = {}, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/myadmin/users", {
        params: { page, limit, search },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue("Failed to fetch users");
    }
  }
);

// ======================================================
// CREATE USER
// ======================================================

export const createAdminUser = createAsyncThunk(
  "adminUsers/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/myadmin/users/create", payload);
      return res.data.user;
    } catch (err) {
      return rejectWithValue("Failed to create user");
    }
  }
);

// ======================================================
// GET SINGLE USER
// ======================================================

export const fetchSingleAdminUser = createAsyncThunk(
  "adminUsers/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/myadmin/users/${id}`);
      return res.data.user;
    } catch (err) {
      return rejectWithValue("Failed to fetch user");
    }
  }
);

// ======================================================
// TOGGLE STATUS
// ======================================================

export const updateUserStatus = createAsyncThunk(
  "adminUsers/status",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      await axios.patch("/api/myadmin/users/status", {
        id,
        status,
      });

      return { id, status };
    } catch (err) {
      return rejectWithValue("Failed to update status");
    }
  }
);

// ======================================================
// DELETE USER (HARD)
// ======================================================

export const deleteAdminUser = createAsyncThunk(
  "adminUsers/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/myadmin/users/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue("Failed to delete user");
    }
  }
);

// ======================================================
// DELETE USER (HARD)
// ======================================================
export const updateAdminUser = createAsyncThunk(
  "adminUsers/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`/api/myadmin/users/${id}`, data);

      return res.data.user;
    } catch (err) {
      return rejectWithValue("Failed to update user");
    }
  }
);

// ======================================================
// SLICE
// ======================================================

const initialState = {
  list: [],
  page: 1,
  totalPages: 1,
  total: 0,

  selectedUser: null,

  loading: false,
  error: null,
};

const adminUserSlice = createSlice({
  name: "adminUsers",
  initialState,
  reducers: {
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ================= FETCH LIST =================
      .addCase(fetchAdminUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.list;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
        state.total = action.payload.total;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= CREATE =================
      .addCase(createAdminUser.fulfilled, (state, action) => {
        // Insert new user on top
        state.list.unshift(action.payload);
      })

      // ================= FETCH ONE =================
      .addCase(fetchSingleAdminUser.fulfilled, (state, action) => {
        state.selectedUser = action.payload;
      })

      // ================= STATUS TOGGLE =================
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const { id, status } = action.payload;

        const user = state.list.find((u) => u._id === id);
        if (user) user.status = status;
      })
      // ================= UPDATE USER =================
      .addCase(updateAdminUser.pending, (state) => {
        state.loading = true;
      })

      .addCase(updateAdminUser.fulfilled, (state, action) => {
        state.loading = false;

        const updated = action.payload;

        // Update list table
        const index = state.list.findIndex((u) => u._id === updated._id);

        if (index !== -1) {
          state.list[index] = updated;
        }

        // Update selected user (edit page)
        if (state.selectedUser && state.selectedUser._id === updated._id) {
          state.selectedUser = updated;
        }
      })

      .addCase(updateAdminUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= DELETE =================
      .addCase(deleteAdminUser.fulfilled, (state, action) => {
        state.list = state.list.filter((u) => u._id !== action.payload);
      });
  },
});

// ======================================================
// EXPORTS
// ======================================================

export const { clearSelectedUser } = adminUserSlice.actions;

export default adminUserSlice.reducer;
