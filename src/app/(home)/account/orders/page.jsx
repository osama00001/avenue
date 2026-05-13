"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchUserOrders } from "@/store/orderSlice";
import { fetchUserDetails } from "@/store/userSlice";
import OrderCard from "@/components/cards/OrderCard";
import AdminHeader from "@/components/admin/AdminHeader";

const Page = () => {
  const dispatch = useDispatch();

  const { user } = useSelector((s) => s.user);
  const { loading, userOrders } = useSelector((s) => s.orders);

  // ================= FETCH USER =================
  useEffect(() => {
    dispatch(fetchUserDetails());
  }, [dispatch]);

  // ================= FETCH ORDERS AFTER USER READY =================
  useEffect(() => {
    if (user?._id) {
      dispatch(fetchUserOrders(user._id));
    }
  }, [user, dispatch]);

  // ================= LOADING =================
  if (loading)
    return (
      <div className="p-12 text-center text-gray-500">Loading orders...</div>
    );

  // ================= EMPTY STATE =================
  if (!loading && userOrders?.length === 0)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3">📦</div>
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-gray-500">
            Once you place an order, it will appear here.
          </p>
        </div>
      </div>
    );

//   console.log("-=-=- userOrders -=-=-===-", userOrders);

  // ================= PAGE =================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <AdminHeader title="Your Orders" />

        <div className="space-y-4">
          {userOrders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
