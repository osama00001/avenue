"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderDetails, clearSelectedOrder } from "@/store/orderSlice";
import { fetchUserDetails } from "@/store/userSlice";

// ---------------- Status Colors ----------------
const statusStyles = {
  placed: "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

// ---------------- Components ----------------
const Card = ({ children }) => (
  <div className="bg-white rounded-xl shadow-sm border p-6">{children}</div>
);

const Label = ({ label, value }) => (
  <div>
    <div className="text-xs text-gray-500">{label}</div>
    <div className="font-medium text-gray-900">{value || "-"}</div>
  </div>
);

// =========================================================
// PAGE
// =========================================================

const OrderDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const { selectedOrder, loading } = useSelector((s) => s.orders);

  useEffect(() => {
    dispatch(fetchUserDetails());
  }, [dispatch]);

  // Fetch order
  useEffect(() => {
    if (id) dispatch(fetchOrderDetails(id));

    return () => dispatch(clearSelectedOrder());
  }, [id, dispatch]);

  if (loading || !selectedOrder)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading order...
      </div>
    );

  const order = selectedOrder;

  // =====================================================
  // UI
  // =====================================================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold">
              Order #{order.orderNumber}
            </h1>

            <div className="text-gray-500 text-sm mt-1">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium
              ${statusStyles[order.status]}`}
            >
              {order.status.toUpperCase()}
            </span>

            <button
              onClick={() => router.back()}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Back
            </button>
          </div>
        </div>

        {/* SUMMARY GRID */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* SHIPPING */}
          <Card>
            <h2 className="font-semibold mb-4">Shipping Address</h2>

            <div className="text-sm text-gray-700 space-y-1">
              <div className="font-medium">{order.shippingAddress.name}</div>
              <div>{order.shippingAddress.line1}</div>
              {order.shippingAddress.line2 && (
                <div>{order.shippingAddress.line2}</div>
              )}
              <div>
                {order.shippingAddress.city}, {order.shippingAddress.state}
              </div>
              <div>{order.shippingAddress.postalCode}</div>
              <div>{order.shippingAddress.country}</div>
              <div className="pt-2 text-gray-500">
                📞 {order.shippingAddress.phone}
              </div>
            </div>
          </Card>

          {/* PAYMENT */}
          <Card>
            <h2 className="font-semibold mb-4">Payment</h2>

            <div className="grid gap-3 text-sm">
              <Label label="Method" value={order.payment.method} />
              <Label label="Status" value={order.payment.status} />
            </div>
          </Card>

          {/* TOTAL */}
          <Card>
            <h2 className="font-semibold mb-4">Summary</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>£{order.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>£{order.shippingCost.toFixed(2)}</span>
              </div>

              <hr />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>£{order.total.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* ITEMS */}
        <Card>
          <h2 className="font-semibold mb-5">Items in this Order</h2>

          <div className="divide-y">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between py-4 items-center">
                <div>
                  <div className="font-medium">{item.title}</div>

                  <div className="text-sm text-gray-500">
                    {item.type.toUpperCase()}
                    {item.ebookFormat && ` • ${item.ebookFormat}`}
                  </div>
                </div>

                <div className="text-right">
                  <div>
                    £{item.price.toFixed(2)} × {item.quantity}
                  </div>

                  <div className="font-semibold">
                    £{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OrderDetails;
