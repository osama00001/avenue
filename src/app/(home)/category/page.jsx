"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserCategories } from "@/store/userCategorySlice";
import ProductCard from "@/components/ProductCard";
import CategorySidebar from "@/components/CategorySidebar";

function placeholderFor(index, page = 1) {
  return `/img/placeholder/${((index + (page - 1) * 20) % 82) + 1}.jpg`;
}

const Category = () => {
  const dispatch = useDispatch();

  const {
    books,
    initialLoading,
    categoryLoading,
    page,
    totalPages,
  } = useSelector((state) => state.userCategory);

  useEffect(() => {
    dispatch(fetchUserCategories({ page: 1 }));
  }, [dispatch]);

  const goToPage = (p) => {
    dispatch(fetchUserCategories({ page: p }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ─── Skeleton loader ─── */
  if (initialLoading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <CategorySidebar />
        <main className="flex-1 p-6">
          <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-[340px] bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  /* ─── Page window ─── */
  const pageWindow = () => {
    const pages = [];
    const delta = 2;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "…") {
        pages.push("…");
      }
    }
    return pages;
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <CategorySidebar />

      <main className="flex-1 p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-black">
          Featured Books
          {categoryLoading && (
            <span className="text-sm text-gray-400 animate-pulse">loading…</span>
          )}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {books.map((book, index) => (
            <ProductCard
              key={book._id}
              product={{
                ...book,
                image: book.coverImage,
              }}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 gap-1 flex-wrap">
            <button
              disabled={page === 1}
              onClick={() => goToPage(page - 1)}
              className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-[#FF6A00] hover:text-white hover:border-[#FF6A00] disabled:opacity-40 disabled:pointer-events-none transition"
            >
              ← Prev
            </button>

            {pageWindow().map((p, i) =>
              p === "…" ? (
                <span key={`e-${i}`} className="px-2 text-gray-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`px-3 py-1.5 text-sm rounded border transition ${
                    p === page
                      ? "bg-[#FF6A00] text-white border-[#FF6A00] font-semibold"
                      : "bg-white border-gray-300 hover:bg-[#FF6A00] hover:text-white hover:border-[#FF6A00]"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              disabled={page === totalPages}
              onClick={() => goToPage(page + 1)}
              className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-[#FF6A00] hover:text-white hover:border-[#FF6A00] disabled:opacity-40 disabled:pointer-events-none transition"
            >
              Next →
            </button>
          </div>
        )}

        {totalPages > 1 && (
          <p className="text-center text-xs text-gray-400 mt-2">
            Page {page} of {totalPages}
          </p>
        )}
      </main>
    </div>
  );
};

export default Category;
