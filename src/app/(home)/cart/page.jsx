"use client";

import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faMinus,
  faPlus,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCart,
  updateCartQuantity,
  removeFromCart,
} from "@/store/cartSlice";
import { useEffect } from "react";
import reverseName from "@/lib/reverseName";
import { useRouter } from "next/navigation";
import { fetchUserDetails } from "@/store/userSlice";

export default function CartPage() {
  const dispatch = useDispatch();
  const { items = [] } = useSelector((state) => state.cart);
  const { user, isLogin } = useSelector((state) => state.user);
  const router = useRouter();
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

  const shippingCost = subtotal > 25 ? 0 : 2.99;
  const total = subtotal + shippingCost;

  const handleCheckout = () => {
    if (!isLogin) {
      router.push("/auth/user/login");
    } else {
      router.push("/checkout");
    }
    // console.log("Checkout");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* BREADCRUMB */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 text-sm">
          <Link href="/" className="text-[#FF6A00] hover:underline">
            Home
          </Link>{" "}
          / <span className="font-medium">Shopping Basket</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif font-bold mb-2">Shopping Basket</h1>

        <p className="text-gray-600 mb-8">
          You have <b>{items.length}</b> item(s) in your basket
        </p>

        {items.length === 0 ? (
          <div className="bg-white p-12 text-center rounded">
            <h2 className="text-2xl font-bold mb-4">Your basket is empty</h2>
            <Link
              href="/"
              className="bg-[#FF6A00] text-white px-6 py-3 rounded-lg inline-block"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* CART ITEMS */}
            <div className="lg:col-span-2 bg-white rounded">
              {items.map((item) => {
                const book = item.book;
                if (!book) return null;

                const title = getTitle(book);
                const price = getFinalPrice(book);
                const author = getAuthor(book);

                return (
                  <div key={book._id} className="p-6 border-b">
                    <div className="grid sm:grid-cols-4 gap-6">
                      {/* IMAGE */}
                      <div className="relative h-32 bg-gray-100 flex items-center justify-center">
                        {book.coverImage ? (
                          <Image
                            src={book.coverImage}
                            alt={title}
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <span className="text-gray-400 text-[10px] text-center px-2">{title}</span>
                        )}
                      </div>

                      {/* INFO */}
                      <div className="sm:col-span-3 flex justify-between">
                        <div>
                          <Link href={`/${book._id}`}>
                            <h3 className="font-semibold text-lg">{title}</h3>
                          </Link>
                          <p className="text-sm text-gray-600">{author}</p>

                          {/* QUANTITY */}
                          <div className="flex items-center gap-3 mt-3">
                            <button
                              className="cursor-pointer"
                              disabled={item.quantity <= 1}
                              onClick={() =>
                                dispatch(
                                  updateCartQuantity({
                                    bookId: book._id,
                                    quantity: item.quantity - 1,
                                  })
                                )
                              }
                            >
                              <FontAwesomeIcon icon={faMinus} />
                            </button>

                            <span className="font-semibold border border-black px-3 rounded-sm">
                              {item.quantity}
                            </span>

                            <button
                              className="cursor-pointer"
                              onClick={() =>
                                dispatch(
                                  updateCartQuantity({
                                    bookId: book._id,
                                    quantity: item.quantity + 1,
                                  })
                                )
                              }
                            >
                              <FontAwesomeIcon icon={faPlus} />
                            </button>
                          </div>
                        </div>

                        {/* PRICE & REMOVE */}
                        <div className="text-right ml-8">
                          <p className="font-bold">
                            £{(price * item.quantity).toFixed(2)}
                          </p>

                          <button
                            onClick={async () => {
                              // return;
                              const response = await dispatch(
                                removeFromCart({
                                  bookId: book._id,
                                  // ebookFormat: book?.ebookCategories[0],
                                })
                              );

                              if(response?.type ==="cart/remove/fulfilled"){
                                toast.success("Item removed from cart");
                              }

                              // console.log(
                              //   "-=-=-= response in the itrem cart delete  -=-=-=",
                              //   response
                              // );
                            }}
                            className="text-red-600 mt-2 cursor-pointer "
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <Link
                href="/"
                className="flex items-center gap-2 p-6 text-[#FF6A00]"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Continue Shopping
              </Link>
            </div>

            {/* SUMMARY */}
            <div className="bg-white p-6 rounded h-fit">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>£{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between mb-4">
                <span>Delivery</span>
                <span>{shippingCost === 0 ? "FREE" : `£${shippingCost}`}</span>
              </div>

              <hr />

              <div className="flex justify-between font-bold text-lg mt-4">
                <span>Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full cursor-pointer mt-6 bg-[#FF6A00] text-white py-3 rounded"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
