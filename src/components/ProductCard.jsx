"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import afterDiscountPrice from "@/lib/afterDiscountPrice";
import { addToCart } from "@/store/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const { syncing } = useSelector((s) => s.cart);
  const [imgError, setImgError] = useState(false);

  const { _id, image, availabilityStatus, isSellable } = product;

  // ---------------- TITLE ----------------
  const title = product?.descriptiveDetail?.titles?.[0]?.text || "Untitled";

  // ---------------- AUTHOR ----------------
  const author = product?.descriptiveDetail?.contributors?.find(
    (c) => c.role === "A01"
  )?.nameInverted;

  // ---------------- FORMAT ----------------
  const ebookFormat = product?.ebookCategories?.[0] || null;

  const format =
    ebookFormat || product?.type || product?.descriptiveDetail?.productForm;

  // ---------------- PRICE ----------------
  const priceObj = product?.productSupply?.prices?.[0];
  const originalPrice = priceObj?.amount ? Number(priceObj.amount) : null;
  const discountPercent = priceObj?.discountPercent ? Number(priceObj.discountPercent) : 0;
  const finalPrice = originalPrice !== null ? afterDiscountPrice(originalPrice, discountPercent) : null;

  // ---------------- ADD TO CART ----------------
  const addToBasket = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await dispatch(addToCart({ bookId: _id, quantity: 1, ebookFormat })).unwrap();
      toast.success("Added to cart");
    } catch {
      toast.error("Failed to add item");
    }
  };

  return (
    <Link href={`/${_id}`} className="group shrink-0 block">
      {/* IMAGE */}
      <div className="relative w-full h-[340px] overflow-hidden bg-gray-100 flex items-center justify-center">
        {image && image.length > 5 && !image.includes("undefined") && !imgError ? (
          <Image 
            src={image} 
            alt={title} 
            fill 
            className="object-contain" 
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
            <span className="text-gray-400 text-xs uppercase font-bold tracking-widest leading-tight">
              {title}
            </span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 w-full bg-gray-100/95 p-3 space-y-2">
          {isSellable && (
            <button
              type="button"
              onClick={addToBasket}
              disabled={syncing}
              className="w-full bg-black text-white py-2.5 cursor-pointer text-sm font-semibold hover:bg-[#FF6A00] transition disabled:bg-gray-300"
            >
              {syncing ? "ADDING…" : (availabilityStatus === "preorder" ? "PRE-ORDER" : "ADD TO BASKET")}
            </button>
          )}

          {!isSellable && (
            <button
              type="button"
              disabled
              className="w-full bg-yellow-500 text-black py-2.5 text-sm font-semibold cursor-not-allowed"
            >
              Out of Stock
            </button>
          )}
        </div>
      </div>

      {/* INFO */}
      <div className="mt-3 space-y-1 text-black">
        <h3 className="text-sm font-semibold leading-tight line-clamp-2 h-10">{title}</h3>
        {author && <p className="text-sm text-[#FF6A00] font-medium truncate">{author}</p>}
        {format && <p className="text-sm text-gray-600 capitalize">{format}</p>}
        {finalPrice !== null ? (
          <div className="flex gap-2 text-sm font-semibold">
            {discountPercent > 0 && <span className="line-through text-gray-400 font-normal">£{originalPrice.toFixed(2)}</span>}
            <span>£{finalPrice}</span>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic font-normal text-xs">Price not available</p>
        )}
      </div>
    </Link>
  );
}
