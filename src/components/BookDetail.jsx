"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import parse from "html-react-parser";
import afterDiscountPrice from "@/lib/afterDiscountPrice";
import { addToCart } from "@/store/cartSlice";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";

const formatDate = (dateStr) => {
  if (!dateStr || dateStr.length !== 8) return null;

  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);

  const date = new Date(`${year}-${month}-${day}`);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function BookDetail({ book }) {
  const router = useRouter();
  const dispatch = useDispatch();

  if (!book) return null;

  const title = book?.descriptiveDetail?.titles?.[0]?.text || "Untitled";
  const format = "Paperback";
  const publisher = book?.publishingDetail?.publisher?.name || "Unknown";
  const publishingDate = formatDate(book?.publishingDetail?.publishingDate);
  const isbn = book?.productIdentifiers?.[0]?.value || "--";

  const description =
    book?.collateralDetail?.textContents?.[1]?.text ||
    book?.collateralDetail?.textContents?.[0]?.text ||
    "No description available.";

  const categories = book?.descriptiveDetail?.subjects
    ?.filter((item) => item.scheme !== "93")
    .map((item) => item.headingText)
    .join(", ");

  const originalPrice = Number(
    book?.productSupply?.prices?.[0]?.amount || 0
  ).toFixed(2);

  const discountPercent = Number(
    book?.productSupply?.prices?.[0]?.discountPercent || 0
  ).toFixed(2);

  const price = afterDiscountPrice(originalPrice, discountPercent);

  const [expandDescription, setExpandDescription] = useState(false);

  const addToBasket = () => {
    dispatch(addToCart({ bookId: book._id, quantity: 1 }));
    toast.success("Product added to cart");
  };

  return (
    <div className="max-w-7xl mx-auto text-black px-4 py-10 space-y-2">
      <div className="grid cols-1 gap-6 lg:grid-cols-2">
        <div className="p-4 flex justify-center">
          <div className="relative w-[320px] h-[480px] bg-gray-100">
            <Image
              src={book.image}
              alt={title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-contain"
            />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div>
            <h1 className="text-3xl font-serif font-semibold mb-3">{title}</h1>
            <h2 className="text-xl font-semibold mb-2">by {book.author}</h2>

            {book.series && (
              <p className="text-sm text-green-700 mb-6">
                Part of the {book.series} series
              </p>
            )}

            <div className="space-y-2 text-sm">
              <p><b>Format:</b> {format}</p>
              <p><b>Publisher:</b> {publisher}</p>
              <p><b>Publishing Date:</b> {publishingDate}</p>
              <p><b>Categories:</b> {categories}</p>
              <p><b>ISBN:</b> {isbn}</p>
            </div>
          </div>

          <div className="border p-4 space-y-3">
            <div className="flex items-center justify-center gap-4">
              <span className="line-through text-gray-400">£{originalPrice}</span>
              <span className="text-2xl font-bold">£{price}</span>
              {discountPercent > 0 && (
                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                  - {discountPercent}%
                </span>
              )}
            </div>

            {book?.isSellable &&
              ["in_stock", "available", "to_order", "unknown", "pod"].includes(
                book?.availabilityStatus
              ) && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => router.push("/auth/user/login")}
                    className="w-full border cursor-pointer text-black px-6 py-3 font-semibold hover:bg-black hover:text-white transition"
                  >
                    Sign in to Add to Wishlist
                  </button>

                  <button
                    onClick={addToBasket}
                    className="w-full bg-[#FF6A00] cursor-pointer text-white px-6 py-3 font-semibold hover:bg-white hover:text-[#FF6A00] border border-[#FF6A00] transition"
                  >
                    ADD TO BASKET
                  </button>
                </div>
              )}

            {!book?.isSellable &&
              book?.availabilityStatus === "available" && (
                <button
                  disabled
                  className="w-full border rounded-md bg-gray-100 text-black px-6 py-3 font-semibold"
                >
                  Out of Stock
                </button>
              )}

            {book?.isSellable &&
              book?.availabilityStatus === "preorder" && (
                <button
                  disabled
                  className="w-full border rounded-md bg-gray-100 text-black px-6 py-3 font-semibold"
                >
                  Pre Order
                </button>
              )}
          </div>
        </div>
      </div>

      <div className="mt-10 md:mt-16">
        <div className="border-t pt-10">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="font-serif text-3xl">Description</h2>
            <div className="flex-1 h-px bg-[#FF6A00]" />
          </div>

          <p className="font-bold text-lg mb-6">{title}</p>

          <div className="text-gray-800 leading-relaxed mb-8">
            {expandDescription
              ? parse(description)
              : parse(description.slice(0, 250) + "...")}
          </div>

          <button
            onClick={() => setExpandDescription(!expandDescription)}
            className="text-[#FF6A00] hover:underline font-medium"
          >
            {expandDescription ? "… read less" : "… read more"}
          </button>
        </div>
      </div>
    </div>
  );
}
