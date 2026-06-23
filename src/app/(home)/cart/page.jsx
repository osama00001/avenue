"use client";

import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCart,
  updateCartQuantity,
  removeFromCart,
} from "@/store/cartSlice";
import { useEffect, useState } from "react";
import reverseName from "@/lib/reverseName";
import BookFormatSection from "@/components/BookFormatSection";
import { useRouter } from "next/navigation";
import { fetchUserDetails } from "@/store/userSlice";
import CheckoutSteps from "@/components/checkout/CheckoutSteps";
import OrderSidebar from "@/components/checkout/OrderSidebar";


function CartQuantitySelector({ quantity, onUpdate }) {
  const [showCustom, setShowCustom] = useState(quantity > 10);
  const [draft, setDraft] = useState(
    quantity > 10 ? String(quantity) : ""
  );

  useEffect(() => {
    if (quantity > 10) {
      setShowCustom(true);
      setDraft(String(quantity));
    }
  }, [quantity]);

  const commitCustomQty = () => {
    const qty = parseInt(draft, 10);
    if (!qty || qty <= 10) {
      setShowCustom(false);
      setDraft("");
      if (qty >= 1 && qty <= 10) onUpdate(qty);
      return;
    }
    setDraft(String(qty));
    onUpdate(qty);
  };

  if (showCustom) {
    return (
      <input
        type="number"
        min={11}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitCustomQty}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        placeholder="Qty"
        autoFocus
        className="border border-gray-300 px-2 py-1 text-sm w-16 focus:outline-none focus:border-[#1a1a1a]"
      />
    );
  }

  return (
    <select
      value={quantity <= 10 ? quantity : "10+"}
      onChange={(e) => {
        if (e.target.value === "10+") {
          setShowCustom(true);
          setDraft("");
        } else {
          onUpdate(Number(e.target.value));
        }
      }}
      className="border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-[#1a1a1a] cursor-pointer"
    >
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
      <option value="10+">10+</option>
    </select>
  );
}

export default function CartPage() {
  const dispatch = useDispatch();
  const { items = [] } = useSelector((state) => state.cart);
  const router = useRouter();
  const [imgError, setImgError] = useState(new Array(items.length).fill(false));
  useEffect(() => {
    dispatch(fetchCart());
    dispatch(fetchUserDetails());
  }, [dispatch]);

  /* ---------------- HELPERS ---------------- */
  const getTitle = (book) =>
    book?.descriptiveDetail?.titles?.[0]?.text || "Untitled";

  const getAuthor = (book) =>
    reverseName(book?.descriptiveDetail?.contributors?.[0]?.nameInverted) ||
    "Unknown";

  const getOriginalPrice = (book) =>
    book?.productSupply?.prices?.[0]?.amount || 0;

  const getDiscountPercent = (book) =>
    book?.productSupply?.prices?.[0]?.discountPercent || 0;

  const getFinalPrice = (book) => {
    const price = getOriginalPrice(book);
    const discount = getDiscountPercent(book);
    return discount ? price - (price * discount) / 100 : price;
  };

  /* ---------------- TOTALS ---------------- */
  const subtotal = items.reduce((sum, item) => {
    if (!item.book) return sum;
    return sum + getFinalPrice(item.book) * item.quantity;
  }, 0);

  const itemCount = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const shippingCost = subtotal > 25 ? 0 : 2.99;
  const total = subtotal + shippingCost;

  const handleNext = () => {
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* TOP CHROME */}
        <div className="flex items-center justify-between text-sm mb-5">
          <Link href="/" className="text-[#000000] hover:underline">
            &lt; Back to shopping
          </Link>
          <Link href="/" className="text-[#000000] hover:underline">
            Help
          </Link>
        </div>

        {/* STEP BAR */}
        <CheckoutSteps current="basket" />

        {items.length === 0 ? (
          <div className="bg-white p-12 text-center border border-gray-200 mt-6">
            <h2 className="text-2xl font-bold mb-4">Your basket is empty</h2>
            <Link
              href="/"
              className="bg-[#1a1a1a] text-white px-6 py-3 inline-block hover:bg-[#e86406]"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 mt-6">
            {/* ITEMS */}
            <div className="flex-1">
              <div className="border border-gray-200">
                {items.map((item) => {
                  const book = item.book;
                  if (!book) return null;

                  const title = getTitle(book);
                  const author = getAuthor(book);
                  const original = getOriginalPrice(book);
                  const discountPercent = getDiscountPercent(book);
                  const price = getFinalPrice(book);
                  const formatOriginalPrice = Number(original).toFixed(2);
                  const formatDiscountPercent = Number(discountPercent).toFixed(2);
                  const formatPrice = price.toFixed(2);

                  return (
                    <div
                      key={book._id}
                      className="flex gap-4 p-5 border-b border-gray-200"
                    >
                      {/* IMAGE */}
                      <div className="relative w-16 h-24 flex-shrink-0 bg-gray-50 flex items-center justify-center">
                        {book.coverImage || book.recordReference && !imgError[items.indexOf(item)] ? (
                          <Image
                            src={
                              book.coverImage ||
                              `/covers/${book.recordReference.split("_")[0]}.jpg`
                            }
                            alt={title}
                            fill
                            className="object-contain"
                            sizes="64px"
                            unoptimized={true}
                            onError={() => setImgError((prev) => {
                              const newErrors = [...prev];
                              newErrors[items.indexOf(item)] = true;
                              return newErrors;
                            })}
                          />
                        ) : (
                          <span className="text-gray-400 text-[8px] text-center px-1">
                            {title}
                          </span>
                        )}
                      </div>

                      {/* INFO */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/${book._id}`}>
                          <h3 className="font-semibold leading-snug hover:underline">
                            {title}
                          </h3>
                        </Link>
                        <div className="text-sm">{author}</div>

                        <div className="mt-3">
                          <BookFormatSection
                            book={book}
                            price={formatPrice}
                            originalPrice={formatOriginalPrice}
                            discountPercent={formatDiscountPercent}
                          />
                        </div>

                        <button
                          onClick={async () => {
                            const response = await dispatch(
                              removeFromCart({ bookId: book._id })
                            );
                            if (response?.type === "cart/remove/fulfilled") {
                              toast.success("Item removed from basket");
                            }
                          }}
                          className="text-[#1a1a1a] text-sm underline mt-2 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>

                      {/* QTY + LINE PRICE */}
                      <div className="flex flex-col items-end gap-3">
                        <CartQuantitySelector
                          quantity={item.quantity}
                          onUpdate={(qty) =>
                            dispatch(
                              updateCartQuantity({
                                bookId: book._id,
                                quantity: qty,
                              })
                            )
                          }
                        />

                        <span className="font-semibold whitespace-nowrap">
                          £{(price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* NEXT BUTTON */}
                <div className="flex justify-end p-5 bg-gray-50">
                  <button
                    onClick={handleNext}
                    className="bg-[#1a1a1a] text-white px-8 py-3 font-semibold cursor-pointer hover:bg-[#262626] transition"
                  >
                    NEXT: DELIVERY
                  </button>
                </div>
              </div>
            </div>

            {/* SIDEBAR */}
            <OrderSidebar
              step="basket"
              itemCount={itemCount}
              subtotal={subtotal}
              deliveryCost={shippingCost}
              deliveryLabel="Delivery"
              total={total}
            />
          </div>
        )}
      </div>
    </div>
  );
}
