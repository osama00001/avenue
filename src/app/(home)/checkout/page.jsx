"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { signIn } from "next-auth/react";

import { clearCart, fetchCart } from "@/store/cartSlice";
import { fetchUserDetails } from "@/store/userSlice";
import { placeCODOrder } from "@/store/orderSlice";
import { fetchAddresses } from "@/store/addressSlice";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { FaPaypal, FaRegCreditCard} from "react-icons/fa";

import PayPalButton from "@/components/PayPalButton";
import StripeButton from "@/components/StripeButton";
import CheckoutSteps from "@/components/checkout/CheckoutSteps";
import OrderSidebar from "@/components/checkout/OrderSidebar";
import AddAddressForm from "@/components/forms/AddAddressForm";

const EMPTY_FORM = {
  hasAccount: "no",
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United Kingdom",
};

const Page = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    dispatch(fetchCart());
    dispatch(fetchUserDetails());
  }, [dispatch]);

  const { items = [], loading } = useSelector((s) => s.cart);
  const { user, isLogin } = useSelector((s) => s.user);
  const { placing, selectedOrder } = useSelector((s) => s.orders);
  const { list: addresses, loading: addressesLoading } = useSelector(
    (s) => s.address
  );

  const [phase, setPhase] = useState("delivery"); // "delivery" | "payment"
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [method, setMethod] = useState("stripe");

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (user?._id) dispatch(fetchAddresses(user._id));
  }, [user, dispatch]);

  useEffect(() => {
    if (!isLogin || !addresses.length) return;
    setShowAddAddress(false);
    setSelectedAddressId((prev) => {
      if (prev && prev !== "new" && addresses.some((a) => a._id === prev)) {
        return prev;
      }
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      return def?._id ?? null;
    });

  }, [isLogin, addresses]);

  useEffect(() => {
    if (isLogin && addresses.length === 0 && !addressesLoading) {
      setShowAddAddress(true);
      setSelectedAddressId("new");
    }
  }, [isLogin, addresses.length, addressesLoading]);

  const addressToShipping = (addr) => ({
    label: addr.label || "Delivery",
    name: addr.name,
    email: user?.email || form.email,
    phone: addr.phone,
    line1: addr.line1,
    line2: addr.line2 || "",
    city: addr.city,
    state: addr.state,
    postalCode: addr.postalCode,
    country: addr.country,
  });

  const handleCheckoutLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });

      if (!res || res.error) {
        setLoginError("Invalid email or password");
        return;
      }

      if (items.length > 0) {
        await fetch("/api/cart/merge", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
      }

      const userData = await dispatch(fetchUserDetails()).unwrap();
      if (userData?._id) dispatch(fetchAddresses(userData._id));
      
      toast.success("Signed in successfully");
    } catch {
      setLoginError("Something went wrong. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

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
  const itemCount = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const shippingCost = subtotal > 25 ? 0 : 2.99;
  const total = subtotal + shippingCost;

  useEffect(() => {
    if (selectedOrder?._id) router.push(`/thank-you/${selectedOrder._id}`);
  }, [selectedOrder]);

  const goToPayment = () => {
    if (isLogin) {
      if (selectedAddressId === "new" || showAddAddress) {
        toast.error("Please save a delivery address first");
        return;
      }
      const addr = addresses.find((a) => a._id === selectedAddressId);
      if (!addr) {
        toast.error("Please select a delivery address");
        return;
      }
      setSelectedAddress(addressToShipping(addr));
    } else if (form.hasAccount === "yes") {
      toast.error("Please sign in to continue");
      return;
    } else {
      const required = {
        email: "Email",
        firstName: "First name",
        lastName: "Last name",
        phone: "Phone",
        line1: "Address",
        city: "City",
        state: "State / County",
        postalCode: "Postal code",
        country: "Country",
      };
      const missing = Object.keys(required).filter((k) => !form[k]?.trim());
      if (missing.length) {
        toast.error(
          `Please fill in: ${missing.map((k) => required[k]).join(", ")}`
        );
        return;
      }

      setSelectedAddress({
        label: "Delivery",
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country,
      });
    }

    setPhase("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStepClick = (stepId) => {
    if (stepId === "delivery") setPhase("delivery");
    if (stepId === "basket") router.push("/cart");
  };

  if (loading) return <div className="p-12">Loading...</div>;

  const activeDeliveryCountry =
    selectedAddress?.country ||
    addresses.find((a) => a._id === selectedAddressId)?.country ||
    form.country;

  const isInternational = activeDeliveryCountry !== "United Kingdom";

  const canProceedToPayment = isLogin;
  const PAYMENT_METHODS = [
    { id: "stripe", label: "Credit / Debit card", icon: <FaRegCreditCard className="text-xl text-gray-700" /> },
    // { id: "paypal", label: "PayPal", icon: <FaPaypal className="text-xl text-[#003087]" /> },
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* TOP CHROME */}
        <div className="flex items-center justify-between text-sm mb-5">
          <Link href="/cart" className="text-[#000000] hover:underline">
            &lt; Back to shopping
          </Link>
          <Link href="/" className="text-[#000000] hover:underline">
            Help
          </Link>
        </div>

        {/* STEP BAR */}
        <CheckoutSteps current={phase} onStepClick={handleStepClick} />

        <div className="flex flex-col lg:flex-row gap-6 mt-6">
          {/* MAIN COLUMN */}
          <div className="flex-1">
            {phase === "delivery" ? (
              /* ============ DELIVERY ============ */
              <div className="border border-gray-200 p-6 space-y-5">
                {isLogin ? (
                  /* ============ LOGGED IN: ADDRESS SELECTION ============ */
                  <div className="space-y-4">
                    <h2 className="font-semibold text-lg">Delivery address</h2>

                    {addressesLoading ? (
                      <p className="text-sm text-gray-500">Loading addresses...</p>
                    ) : (
                      <div className="divide-y divide-gray-200 border border-gray-200">
                        {addresses.map((addr) => (
                          <label
                            key={addr._id}
                            className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50"
                          >
                            <RadioDot
                              name="deliveryAddress"
                              checked={selectedAddressId === addr._id}
                              onChange={() => {
                                setSelectedAddressId(addr._id);
                                setShowAddAddress(false);
                              }}
                            />
                            <div className="flex-1 text-sm">
                              <div className="font-medium">
                                {addr.label}
                                {addr.isDefault && (
                                  <span className="ml-2 text-xs bg-[#1a1a1a] text-white px-2 py-0.5">
                                    Default
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-700 mt-0.5">{addr.name}</div>
                              <div className="text-gray-600">
                                {addr.line1}
                                {addr.line2 ? `, ${addr.line2}` : ""}
                                <br />
                                {addr.city}, {addr.state} {addr.postalCode}
                                <br />
                                {addr.country}
                                {addr.phone && (
                                  <>
                                    <br />
                                    {addr.phone}
                                  </>
                                )}
                              </div>
                            </div>
                          </label>
                        ))}

                        <label className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setSelectedAddressId("new");
                          setShowAddAddress(true);
                        }}
                        >
                          <span className="text-sm font-medium text-[#000000]"
                          >
                            {addresses.length === 0
                              ? "Add delivery address"
                              : "Add a new delivery address"}
                          </span>
                        </label>
                      </div>
                    )}

                    {showAddAddress && user?._id && (
                      <AddAddressForm
                        userId={user._id}
                        onSuccess={() => {
                          dispatch(fetchAddresses(user._id)).then((result) => {
                            const list = result.payload || [];
                            const newest =
                              list.find((a) => a.isDefault) || list[0];
                            if (newest) {
                              setSelectedAddressId(newest._id);
                              setShowAddAddress(false);
                            }
                          });
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <>
                    {/* ============ GUEST: ACCOUNT QUESTION ============ */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 pb-4 border-b border-gray-200">
                      <span className="font-medium sm:w-48">
                        Do you have an account?
                      </span>
                      <div className="flex items-center gap-6">
                        {["yes", "no"].map((opt) => (
                          <label
                            key={opt}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="hasAccount"
                              checked={form.hasAccount === opt}
                              onChange={() => setField("hasAccount", opt)}
                              className="accent-[#1a1a1a]"
                            />
                            <span className="capitalize">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {form.hasAccount === "yes" && (
                      <CheckoutLoginForm
                        email={loginEmail}
                        password={loginPassword}
                        showPassword={showPassword}
                        loading={loginLoading}
                        error={loginError}
                        onEmailChange={setLoginEmail}
                        onPasswordChange={setLoginPassword}
                        onTogglePassword={() => setShowPassword((v) => !v)}
                        onSubmit={handleCheckoutLogin}
                      />
                    )}

                    {form.hasAccount === "no" && (
                      <>
                        <div className="bg-orange-50 border border-orange-100 p-4 text-sm text-gray-700">
                          <p className="mb-3">
                            Creating an account lets you check out faster, save
                            multiple addresses, and track your orders.
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              router.push("/auth/user/register")
                            }
                            className="bg-[#1a1a1a] text-white px-6 py-2 font-semibold hover:bg-[#e86406] cursor-pointer"
                          >
                            CREATE AN ACCOUNT
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={goToPayment}
                    disabled={!canProceedToPayment}
                    className={`px-8 py-3 font-semibold text-white ${
                      canProceedToPayment
                        ? "bg-[#1a1a1a] hover:bg-[#262626] cursor-pointer"
                        : "bg-gray-300 cursor-not-allowed"
                    }`}
                  >
                    NEXT: PAYMENT
                  </button>
                </div>
              </div>
            ) : (
              /* ============ PAYMENT ============ */
              <div className="space-y-4">

                <div className="border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold mb-4">
                    Choose your payment method:
                  </h2>

                  <div className="divide-y divide-gray-200 border border-gray-200">
                    {PAYMENT_METHODS.map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-3 p-4 cursor-pointer"
                      >
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center
                            ${method === m.id ? "border-[#1a1a1a]" : "border-gray-400"}`}
                        >
                          {method === m.id && (
                            <span className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
                          )}
                        </span>
                        <input
                          type="radio"
                          name="payment"
                          className="hidden"
                          checked={method === m.id}
                          onChange={() => setMethod(m.id)}
                        />
                        <span className="flex-1 text-[#000000]">{m.label}</span>
                        {m.icon}
                      </label>
                    ))}
                  </div>

                  {/* ACTION AREA */}
                  <div className="mt-6">
                    {/* {method === "stripe" ? ( */}
                      <StripeButton
                        amount={total.toFixed(2)}
                        userId={user?._id}
                        cart={items}
                        selectedAddress={selectedAddress}
                      />
                    {/* ) : ( */}
                    {/* //   <PayPalButton
                    //     amount={total.toFixed(2)}
                    //     userId={user?._id}
                    //     cart={items}
                    //     selectedAddress={selectedAddress}
                    //   />
                    // )} */}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <OrderSidebar
            step={phase}
            itemCount={itemCount}
            subtotal={subtotal}
            deliveryCost={shippingCost}
            deliveryLabel={isInternational ? "International courier" : "Delivery"}
            total={total}
            deliverTo={selectedAddress}
          />
        </div>
      </div>
    </div>
  );
};

const inputCls =
  "w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]";

function RadioDot({ checked, onChange, name }) {
  return (
    <>
      <span
        className={`w-4 h-4 mt-0.5 rounded-full border flex-shrink-0 flex items-center justify-center
          ${checked ? "border-[#1a1a1a]" : "border-gray-400"}`}
      >
        {checked && <span className="w-2 h-2 rounded-full bg-[#1a1a1a]" />}
      </span>
      <input
        type="radio"
        name={name}
        className="hidden"
        checked={checked}
        onChange={onChange}
      />
    </>
  );
}

function CheckoutLoginForm({
  email,
  password,
  showPassword,
  loading,
  error,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-2">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">
          {error}
        </p>
      )}

      <input
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        placeholder="Please type your email address"
        className={inputCls}
        required
      />

      <Link
        href="/auth/user/forgot-password"
        className="text-sm text-[#000000] underline inline-block"
      >
        Forgot password
      </Link>

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="Please type your password"
          className={`${inputCls} pr-10`}
          required
        />
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
        </button>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-2.5 font-semibold text-white bg-[#1a1a1a] hover:bg-[#e86406] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "SIGNING IN..." : "SIGN IN"}
        </button>
      </div>
    </form>
  );
}

export default Page;
