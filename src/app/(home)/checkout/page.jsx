"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import CheckoutItemCard from "@/components/cards/CheckoutItemsCard";
import AddAddressForm from "@/components/forms/AddAddressForm";

import { clearCart, fetchCart } from "@/store/cartSlice";
import { fetchUserDetails } from "@/store/userSlice";
import { placeCODOrder } from "@/store/orderSlice";
import { fetchAddresses } from "@/store/addressSlice";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PayPalButton from "@/components/PayPalButton";
import StripeButton from "@/components/StripeButton";
import PaymentMethodSelector from "@/components/PaymentMethodSelector";

const Page = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  // ================= INIT FETCH =================
  useEffect(() => {
    dispatch(fetchCart());
    dispatch(fetchUserDetails());
  }, [dispatch]);

  const { items = [], loading } = useSelector((s) => s.cart);
  const { user } = useSelector((s) => s.user);
  const { placing, selectedOrder } = useSelector((s) => s.orders);
  const { list: addresses } = useSelector((s) => s.address);

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [method, setMethod] = useState("stripe"); // default to stripe

  // fetch addresses when user loaded
  useEffect(() => {
    if (user?._id) {
      dispatch(fetchAddresses(user._id));
    }
  }, [user, dispatch]);

  // auto select default
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddress(def);
    }
  }, [addresses]);

  // ================= PRICING =================
  const getPrice = (book) => {
    const price = book?.productSupply?.prices?.[0]?.amount || 0;
    const discount = book?.productSupply?.prices?.[0]?.discountPercent || 0;
    return discount ? price - (price * discount) / 100 : price;
  };

  const subtotal = items.reduce(
    (sum, i) => sum + getPrice(i.book) * i.quantity,
    0
  );

  const shippingCost = subtotal > 25 ? 0 : 2.99;
  const total = subtotal + shippingCost;

  useEffect(() => {
    if (selectedOrder?._id) {
      router.push(`/thank-you/${selectedOrder._id}`);
    }
  }, [selectedOrder]);

  // ================= COD =================
  const handleCOD = async () => {
    // ============================
    // VALIDATION
    // ============================
    if (!selectedAddress) {
      toast.error("Please select a shipping address");
      return;
    }

    if (!items.length) {
      toast.error("Cart is empty");
      return;
    }

    try {
      // ============================
      // BUILD PAYLOAD
      // ============================
      const cartPayload = items.map((item) => ({
        bookId: item.book._id,
        quantity: item.quantity,
        ebookFormat: item.ebookFormat || null,
      }));

      // ============================
      // PLACE ORDER
      // ============================
      const order = await dispatch(
        placeCODOrder({
          userId: user._id,
          cart: cartPayload,
          shippingAddress: selectedAddress,
        })
      ).unwrap();

      // ============================
      // FRONTEND CART CLEAR
      // ============================
      dispatch(clearCart());

      // ============================
      // SUCCESS UX
      // ============================
      toast.success("Order placed successfully!");

      // Navigate to thank you page with order id
      router.push(`/checkout/thank-you?order=${order._id}`);
    } catch (err) {
      console.error(err);

      toast.error(err?.message || "Something went wrong placing order");
    }
  };

  const handlePaymentSelect = (method) => {
    setMethod(method);
  };

  if (loading) return <div className="p-12">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif font-bold mb-2">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT — CART */}
          <div className="flex-1 space-y-4">
            {items.map((item) => (
              <CheckoutItemCard item={item} key={item.book._id} />
            ))}
          </div>

          {/* RIGHT PANEL */}
          <div className="w-full lg:w-[380px] space-y-5">
            {/* ADDRESS SELECTOR */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>

              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr._id}
                    className={`block border rounded-lg p-3 cursor-pointer
                      ${
                        selectedAddress?._id === addr._id
                          ? "border-[#FF6A00] bg-[#ff6a0022]"
                          : ""
                      }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddress?._id === addr._id}
                      onChange={() => setSelectedAddress(addr)}
                      className="mr-2 accent-[#FF6A00] bg-white"
                    />

                    <div className="text-sm">
                      <div className="font-medium">{addr.name}</div>
                      <div>
                        {addr.line1} {addr.city}
                      </div>
                      <div>
                        {addr.postalCode} {addr.country}
                      </div>
                    </div>
                  </label>
                ))}

                {/* Toggle Add Form */}
                <button
                  onClick={() => {
                    router.push("/address");
                  }}
                  className="text-[#FF6A00] cursor-pointer font-medium text-sm"
                >
                  + Add New Address
                </button>

                {showAddForm && (
                  <AddAddressForm
                    userId={user._id}
                    onSuccess={() => {
                      dispatch(fetchAddresses(user._id));
                      setShowAddForm(false);
                    }}
                  />
                )}
              </div>
            </div>

            {/* TOTAL */}
            <div className="bg-white rounded-lg shadow py-6 px-5">
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
            </div>

            {/* PAYMENT */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>

              <button
                onClick={handleCOD}
                disabled={!selectedAddress || placing}
                className={`w-full cursor-pointer py-3 rounded-lg text-white
                  ${
                    selectedAddress
                      ? "bg-[#FF6A00] hover:bg-[#e86406]"
                      : "bg-gray-300"
                  }`}
              >
                {placing ? "Placing Order..." : "Pay with COD"}
              </button>

            {/* <div className="mt-4">
              <PayPalButton amount={total.toFixed(2)} userId={user?._id} cart={items} selectedAddress={selectedAddress} />
            </div> */}

            <div className="max-w-xl mx-auto mt-10">
              <PaymentMethodSelector onSelect={handlePaymentSelect} />

              {/* PayPal Button Show Only When Selected */}
              {method === "paypal" && (
                <div className="mt-6">
                  <PayPalButton
                    amount={total.toFixed(2)}
                    userId={user?._id}
                    cart={items}
                    selectedAddress={selectedAddress}
                  />
                </div>
              )}

              {/* Stripe Button Show Only When Selected */}
              {method === "stripe" && (
                <div className="mt-6">
                  <StripeButton
                    amount={total.toFixed(2)}
                    userId={user?._id}
                    cart={items}
                    selectedAddress={selectedAddress}
                  />
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
