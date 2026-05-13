import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

/**
 * ----------------------------------------
 * Async Thunk
 * ----------------------------------------
 */
// export const fetchUserCategories = createAsyncThunk(
//   "categories/fetch",
//   async ({ category,  } = {}, { rejectWithValue }) => {
//     try {
//       const res = await axios.get("/api/category", {
//         params: category ? { category } : {},
//       });
  

//       return res.data;
//     } catch (err) {
//       return rejectWithValue("Failed to fetch categories");
//     }
//   }
// );

export const fetchUserCategories = createAsyncThunk(
  "categories/fetch",
  async ({ category, page = 1 } = {}, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/category", {
        params: {
          ...(category ? { category } : {}),
          page,
        },
      });

      return res.data;
    } catch (err) {
      return rejectWithValue("Failed to fetch categories");
    }
  }
);


/**
 * ----------------------------------------
 * Initial State
 * ----------------------------------------
 */
const initialState = {
  categories: [],           // flat list (root + loaded subcategories)
  books: [],                // books for selected category
  selectedCategory: null,   // currently selected category code

  // loading states
  initialLoading: true,     // only for first page load
  categoryLoading: false,   // for category clicks / expansion


  // pagination
  page: 1,
  perPage: 20,
  totalPages: 1,


  error: null,
};

/**
 * ----------------------------------------
 * Slice
 * ----------------------------------------
 */
const userCategorySlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    // future sync reducers go here
  },
  extraReducers: (builder) => {
    builder

      /**
       * ----------------------------------------
       * PENDING
       * ----------------------------------------
       */
      .addCase(fetchUserCategories.pending, (state) => {
        if (state.categories.length === 0) {
          state.initialLoading = true;
        } else {
          state.categoryLoading = true;
        }
        state.error = null;
      })

      /**
       * ----------------------------------------
       * FULFILLED
       * ----------------------------------------
       */
    .addCase(fetchUserCategories.fulfilled, (state, action) => {
        state.initialLoading = false;
        state.categoryLoading = false;

      
        const payload = action.payload || {};

        const responseType = payload.type; // ROOT / CATEGORY

        if (!responseType) {
          console.warn("⚠ Missing 'type' in API response");
          return;
        }


          state.page = payload.page;
        state.totalPages = payload.totalPages;
        state.perPage = payload.perPage;


        // ===== ROOT =====
        if (responseType === "ROOT") {
          state.categories = Array.isArray(payload.categories)
            ? payload.categories
            : [];

          state.books = Array.isArray(payload.books)
            ? payload.books
            : [];

          state.selectedCategory = null;
          return;
        }

        // ===== CATEGORY =====
        if (responseType === "CATEGORY") {
          const selectedCode = payload?.selectedCategory?.code || null;
          state.selectedCategory = selectedCode;

          // Replace old categories with only current subCategories
          state.categories = Array.isArray(payload.subCategories)
            ? payload.subCategories
            : [];

          // Replace books too
          state.books = Array.isArray(payload.books)
            ? payload.books
            : [];
        }

        })


      /**
       * ----------------------------------------
       * REJECTED
       * ----------------------------------------
       */
      .addCase(fetchUserCategories.rejected, (state, action) => {
        state.initialLoading = false;
        state.categoryLoading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default userCategorySlice.reducer;
