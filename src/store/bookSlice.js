import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";

// 1️⃣ Create async thunk for API call
export const fetchBookForAdmin = createAsyncThunk(
    "book/fetchBook",
    async (isbn) => {
        const response = await api.get(`/myadmin/books/${isbn}`);
        return response.data;
    }
);


export const fetchBooksForHome = createAsyncThunk(
    "books/fetchBooks",
    async (params = {}) => {
        const { category, limit, search, sort, page } = params;

        const response = await api.get("/books", {
            params: {
                category,
                limit,
                search,
                sort,
                page,
            },
        });
        return { "books": response.data, "category": category, "search": search };
    }
);

export const fetchSingleBook = createAsyncThunk(
    "books/fetchSingleBook",
    async (id) => {
        const response = await api.get(`/books/${id}`);
        return { "books": response.data };
    }
);

const bookSlice = createSlice({
    name: "book",
    initialState: {
        books: [],
        catalog: [],
        bestsellers: [],
        popular: [],
        new_books: [],
        highlights: [],
        special_editions: [],
        coming_soon: [],
        fiction: [],
        non_fiction: [],
        recently_reviewed: [],
        paperback_books: [],
        children_books: [],
        language: [],
        games: [],
        adult_books: [],
        gift_books: [],
        searchResults: [],
        title: "",
        isbn: "",
        author: "",
        price: 0,
        loading: false,
        error: null,
        searchText: "",
    },
    reducers: {
        setBook(state, action) {
            state.title = action.payload.title;
            state.isbn = action.payload.isbn;
            state.author = action.payload.author;
            state.price = action.payload.price;
        },
        setReduxSearchText(state, action) {
            state.searchText = action.payload;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(fetchBookForAdmin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBookForAdmin.fulfilled, (state, action) => {
                state.loading = false;
                state.title = action.payload.title;
                state.isbn = action.payload.isbn;
                state.author = action.payload.author;
                state.price = action.payload.price;
            })
            .addCase(fetchBookForAdmin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })

            .addCase(fetchSingleBook.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSingleBook.fulfilled, (state, action) => {
                state.books = action.payload.books;
                state.loading = false;
            })

            .addCase(fetchBooksForHome.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBooksForHome.fulfilled, (state, action) => {
                if (action.payload.search) {
                    state.searchResults = action.payload.books;
                } else if (action.payload.category === "catalog") {
                    state.catalog = action.payload.books;
                } else if (action.payload.category === "bestsellers") {
                    state.bestsellers = action.payload.books;
                } else if (action.payload.category === "popular") {
                    state.popular = action.payload.books;
                } else if (action.payload.category === "new_books") {
                    state.new_books = action.payload.books;
                } else if (action.payload.category === "highlights") {
                    state.highlights = action.payload.books;
                } else if (action.payload.category === "special_editions") {
                    state.special_editions = action.payload.books;
                } else if (action.payload.category === "coming_soon") {
                    state.coming_soon = action.payload.books;
                } else if (action.payload.category === "fiction") {
                    state.fiction = action.payload.books;
                } else if (action.payload.category === "non_fiction") {
                    state.non_fiction = action.payload.books;
                } else if (action.payload.category === "recently_reviewed") {
                    state.recently_reviewed = action.payload.books;
                } else if (action.payload.category === "paperback_books") {
                    state.paperback_books = action.payload.books;
                } else if (action.payload.category === "children_books") {
                    state.children_books = action.payload.books;
                } else if (action.payload.category === "language") {
                    state.language = action.payload.books;
                } else if (action.payload.category === "games") {
                    state.games = action.payload.books;
                } else if (action.payload.category === "adult_books") {
                    state.adult_books = action.payload.books;
                } else if (action.payload.category === "gift_books") {
                    state.gift_books = action.payload.books;
                } else {
                    state.books = action.payload.books;
                }
                state.loading = false;
            })
            .addCase(fetchBooksForHome.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    },
});

export const { setBook, setReduxSearchText } = bookSlice.actions;
export default bookSlice.reducer;
