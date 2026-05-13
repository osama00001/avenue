import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { signOut } from "next-auth/react";

/* ---------------- ASYNC THUNKS ---------------- */

/**
 * Fetch logged-in user details
 * Assumes session/cookie auth (NextAuth or similar)
 */
export const fetchUserDetails = createAsyncThunk(
  "user/fetchUserDetails",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/user/me");
      return res.data; // { name, email, ... }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch user details"
      );
    }
  }
);

/**
 * Logout user (NextAuth + Redux reset)
 */
export const logoutUser = createAsyncThunk(
  "user/logoutUser",
  async ({ callbackUrl }, { rejectWithValue }) => {
    try {
      await signOut({ callbackUrl });
      return true;
    } catch (error) {
      return rejectWithValue("Logout failed");
    }
  }
);

/**
 * Update user profile
 */
export const updateUser = createAsyncThunk(
  "user/updateUser",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.put("/user/update", payload);
      return res.data; // updated user object
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update user"
      );
    }
  }
);

/* ---------------- INITIAL STATE ---------------- */

const initialState = {
  name: "Guest",
  user: null,
  loading: false,
  error: null,
  isLogin: false,
};

/* ---------------- SLICE ---------------- */

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setName(state, action) {
      state.name = action.payload;
    },
    clearUserError(state) {
      state.error = null;
    },
    resetUser(state) {
      state.user = null;
      state.name = "Guest";
      state.loading = false;
      state.error = null;
      state.isLogin = false;
    },
  },
  extraReducers: (builder) => {
    builder

      /* -------- FETCH USER -------- */
      .addCase(fetchUserDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.name = action.payload?.name || state.name;
        state.isLogin = true;
      })
      .addCase(fetchUserDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* -------- UPDATE USER -------- */
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.name = action.payload?.name || state.name;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      /* -------- LOGOUT USER -------- */
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.name = "Guest";
        state.loading = false;
        state.error = null;
        state.isLogin = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

/* ---------------- EXPORTS ---------------- */

export const { setName, clearUserError, resetUser } = userSlice.actions;

export default userSlice.reducer;
