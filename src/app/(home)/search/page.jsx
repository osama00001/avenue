"use client";

import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faThLarge,
  faList,
  faShoppingCart,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import reverseName from "@/lib/reverseName";
import afterDiscountPrice from "@/lib/afterDiscountPrice";
import { addToCart, fetchCart } from "@/store/cartSlice";
import Link from "next/link";

function SearchPage() {
  const dispatch = useDispatch();
  const { searchResults, searchText, loading } = useSelector(
    (state) => state.book
  );

  const [view, setView] = useState("list");
  const [sortBy, setSortBy] = useState("best-selling");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchingCart = async () => {
      dispatch(fetchCart());
    };
    fetchingCart();
  }, [dispatch]);

  const itemsPerPage = 12;

  /* ---------------- HELPERS ---------------- */
  const mapProduct = (product, index) => {
    const originalPrice = product?.productSupply?.prices?.[0].amount || 0;
    const discountPercent =
      product?.productSupply?.prices?.[0].discountPercent || 0;

    return {
      id: product._id,
      title: product?.descriptiveDetail?.titles?.[0]?.text || "Untitled",
      author: reverseName(
        product?.descriptiveDetail?.contributors?.find(c => c.role === "A01")?.nameInverted
          || product?.descriptiveDetail?.contributors?.[0]?.nameInverted
          || ""
      ),
      price: afterDiscountPrice(originalPrice, discountPercent),
      rrp: originalPrice,
      status: product.availabilityStatus === "preorder" ? "Pre-Order" : "In Stock",
      delivery: product.availabilityStatus === "preorder"
        ? "Expected delivery soon"
        : "Standard delivery: 2–3 days",
      format: product.format || "Paperback",
      image: product.coverImage || `/img/placeholder/${(((product._id || "").charCodeAt((product._id || "").length - 1) || 0) % 82) + 1}.jpg`,
    };
  };

  const products = searchResults.map(mapProduct);

  /* ---------------- SORTING ---------------- */
  const sortedProducts = () => {
    let sorted = [...products];

    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price);
      default:
        return sorted;
    }
  };

  const sorted = sortedProducts();
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = sorted.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, searchResults]);

  const addToBasket = (product) => {
    dispatch(addToCart({ bookId: product.id, quantity: 1 }));
    if (!loading) toast.success("Product added to cart!");
  };

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  /* ---------------- UI (UNCHANGED) ---------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-serif font-bold mb-2">
            Search Results For "{searchText}"
          </h1>
          <p className="text-gray-600">
            Showing{" "}
            <span className="font-semibold">
              {startIndex + 1}–{Math.min(endIndex, sorted.length)}
            </span>{" "}
            of <span className="font-semibold">{sorted.length}</span> results
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* SIDEBAR - FILTERS */}
          {/* <aside className="lg:col-span-1">
            <div className="bg-gradient-to-b from-[#FF6A00] to-[#2a5560] rounded-lg shadow-lg p-6 sticky top-4 space-y-6">
              <div>
                <h3 className="font-bold text-white mb-4 pb-3 border-b border-white border-opacity-30">
                  Filter Results By
                </h3>

                <div className="mb-6">
                  <p className="font-semibold text-white mb-3 text-sm">
                    Product Type
                  </p>
                  <ul className="space-y-2 text-sm">
                    {[
                      "Books",
                      "DVD",
                      "CD",
                      "Blu-ray",
                      "eBooks",
                      "Vinyl",
                      "eAudiobooks",
                    ].map((item) => (
                      <li key={item}>
                        <label className="flex items-center gap-2 cursor-pointer hover:text-yellow-300 transition text-white text-opacity-90 hover:text-opacity-100">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-white accent-yellow-400"
                          />
                          <span>{item}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 border-t border-white border-opacity-30">
                  <p className="font-semibold text-white mb-3 text-sm">
                    Book Categories
                  </p>
                  <ul className="space-y-2 text-sm">
                    {[
                      "Art & Photography",
                      "Biography",
                      "Business, Finance and Law",
                      "Children's",
                      "Comics and Graphic Novels",
                    ].map((item) => (
                      <li key={item}>
                        <label className="flex items-center gap-2 cursor-pointer hover:text-yellow-300 transition text-white text-opacity-90 hover:text-opacity-100">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-white accent-yellow-400"
                          />
                          <span>{item}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <button className="text-yellow-300 font-semibold text-sm mt-3 hover:text-yellow-200 transition">
                    + See more
                  </button>
                </div>

                <div className="pt-6 border-t border-white border-opacity-30">
                  <p className="font-semibold text-white mb-3 text-sm">
                    Price Range
                  </p>
                  <div className="space-y-2 text-black">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="w-full accent-yellow-400"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-1/2 border border-white bg-white bg-opacity-10 text-black placeholder-white placeholder-opacity-50 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-1/2 border border-white bg-white bg-opacity-10 text-black placeholder-white placeholder-opacity-50 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white border-opacity-30">
                  <p className="font-semibold text-white mb-3 text-sm">
                    Availability
                  </p>
                  <ul className="space-y-2 text-sm">
                    {["In Stock", "Pre-Order", "Out of Stock"].map((item) => (
                      <li key={item}>
                        <label className="flex items-center gap-2 cursor-pointer hover:text-yellow-300 transition text-white text-opacity-90 hover:text-opacity-100">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-white accent-yellow-400"
                          />
                          <span>{item}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </aside> */}

          {/* MAIN CONTENT */}
          <main className="lg:col-span-3">
            {/* TOP CONTROLS */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2 sm:mb-0">
                    Sort by:
                  </label>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                >
                  <option value="best-selling">Best Selling</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>

                <div className="flex border border-gray-300 rounded-lg overflow-hidden ml-auto">
                  <button
                    onClick={() => setView("list")}
                    className={`px-4 py-2 text-sm font-medium transition ${
                      view === "list"
                        ? "bg-[#FF6A00] text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                    title="List view"
                  >
                    <FontAwesomeIcon icon={faList} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView("grid")}
                    className={`px-4 py-2 text-sm font-medium transition ${
                      view === "grid"
                        ? "bg-[#FF6A00] text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                    title="Grid view"
                  >
                    <FontAwesomeIcon icon={faThLarge} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* LIST VIEW - MINIMAL DESIGN */}
            {view === "list" && (
              <div className="space-y-4">
                {currentProducts.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-600">No products found.</p>
                  </div>
                ) : (
                  currentProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    >
                      <div className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                        {/* LEFT SIDE - IMAGE & CONTENT */}
                        <div className="flex gap-6 flex-1 w-full">
                          {/* PRODUCT IMAGE */}
                          <div className="flex-shrink-0 w-24 h-32">
                            <div className="relative bg-gray-100 rounded-lg overflow-hidden h-full w-full">
                              <Link href={`/${product.id}`}>
                                <img
                                  src={product.image}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              </Link>
                            </div>
                          </div>

                          {/* PRODUCT INFO */}
                          <div className="flex-1">
                            {/* TITLE */}
                            <Link href={`/${product.id}`}>
                              <h2 className="text-lg font-semibold text-[#FF6A00] hover:text-[#FF6A00] cursor-pointer transition mb-2 line-clamp-1">
                                {product.title}
                              </h2>
                            </Link>

                            {/* AUTHOR */}
                            <p className="text-gray-700 font-medium mb-2 text-sm">
                              {product.author}
                            </p>

                            {/* STATUS & DELIVERY */}
                            <p className="text-sm text-gray-700 mb-1">
                              {product.status} - {product.delivery}
                            </p>

                            {/* FORMAT */}
                            <p className="text-sm text-gray-600">
                              Format: {product.format}
                            </p>
                          </div>
                        </div>

                        {/* RIGHT SIDE - PRICE & BUTTON */}
                        <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                          <div className="text-right">
                            <p className="text-xs text-gray-400 line-through mb-1">
                              RRP £{product.rrp}
                            </p>
                            <p className="text-2xl font-bold text-[#FF6A00]">
                              £{product.price}
                            </p>
                          </div>

                          <button
                            onClick={() => addToBasket(product)}
                            className="bg-[#FF6A00] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#FF6A00] transition flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap"
                          >
                            <FontAwesomeIcon
                              icon={faShoppingCart}
                              className="w-4 h-4"
                            />
                            Add to Basket +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* GRID VIEW */}
            {view === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentProducts.length === 0 ? (
                  <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-600">No products found.</p>
                  </div>
                ) : (
                  currentProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
                    >
                      <div className="relative bg-gray-100 h-64 overflow-hidden group">
                        <Link href={`/${product.id}`}>
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </Link>
                      </div>

                      <div className="p-4 flex flex-col flex-1">
                        <Link href={`/${product.id}`}>
                          <h2 className="font-semibold text-[#FF6A00] mb-1 line-clamp-2 text-sm hover:text-[#FF6A00] cursor-pointer transition">
                            {product.title}
                          </h2>
                        </Link>
                        <p className="text-sm text-gray-700 mb-3">
                          {product.author}
                        </p>

                        <p className="text-xs text-gray-600 mb-3">
                          {product.status}
                        </p>

                        <div className="mt-auto pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-400 line-through mb-1">
                            £{product.rrp}
                          </p>
                          <p className="text-xl font-bold text-[#FF6A00] mb-3">
                            £{product.price}
                          </p>

                          <button
                            onClick={() => addToBasket(product)}
                            className="w-full bg-[#FF6A00] text-white py-2 rounded-lg font-semibold hover:bg-[#FF6A00] transition text-sm flex items-center justify-center gap-2"
                          >
                            <FontAwesomeIcon
                              icon={faShoppingCart}
                              className="w-4 h-4"
                            />
                            Add to Basket
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <p className="text-sm text-gray-600">
                  Page <span className="font-semibold">{currentPage}</span> of{" "}
                  <span className="font-semibold">{totalPages}</span>
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 &&
                          pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                              currentPage === pageNum
                                ? "bg-[#FF6A00] text-white"
                                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === currentPage - 2 ||
                        pageNum === currentPage + 2
                      ) {
                        return (
                          <span key={pageNum} className="px-2 py-2">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className="w-4 h-4"
                    />
                  </button>
                </div>
                <p className="text-gray-600">
                  Showing{" "}
                  <span className="font-semibold">
                    {startIndex + 1}–{Math.min(endIndex, sorted.length)}
                  </span>{" "}
                  of <span className="font-semibold">{sorted.length}</span>{" "}
                  results
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
