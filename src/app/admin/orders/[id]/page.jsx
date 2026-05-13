"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";

import { fetchAdminOrderDetails } from "@/store/adminOrderSlice";

// ======================================================
// STATUS BADGE
// ======================================================

const StatusBadge = ({ status }) => {
  const map = {
    placed: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${
        map[status] || "bg-gray-100"
      }`}
    >
      {status.toUpperCase()}
    </span>
  );
};

// ======================================================
// SECTION WRAPPER
// ======================================================

const Section = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm border p-6">
    <h2 className="font-semibold text-lg mb-4 text-gray-800">{title}</h2>
    {children}
  </div>
);

// ======================================================
// PAGE
// ======================================================

const AdminOrderDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const { selectedOrder, loading } = useSelector((s) => s.adminOrders);

  useEffect(() => {
    if (id) dispatch(fetchAdminOrderDetails(id));
  }, [id, dispatch]);

  if (loading || !selectedOrder)
    return <div className="p-8">Loading order...</div>;

  const order = selectedOrder;

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Order {order.orderNumber}</h1>
          <div className="mt-2">
            <StatusBadge status={order.status} />
          </div>
        </div>

        <button
          onClick={() => router.back()}
          className="border cursor-pointer px-4 py-2 rounded hover:bg-gray-100"
        >
          Back
        </button>
      </div>

      {/* GRID */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* ITEMS */}
          <Section title="Items">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-gray-500 uppercase text-xs tracking-wide">
                    <th className="py-3 px-3 text-left w-[45%]">Title</th>
                    <th className="py-3 px-3 text-left w-[15%]">Type</th>
                    <th className="py-3 px-3 text-right w-[10%]">Qty</th>
                    <th className="py-3 px-3 text-right w-[15%]">Price</th>
                    <th className="py-3 px-3 text-right w-[15%]">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {order.items.map((item, i) => {
                    const title =
                      item.title ||
                      item?.book?.descriptiveDetail?.titles?.[0]?.text ||
                      "Untitled";

                    return (
                      <tr
                        key={i}
                        className="border-b last:border-none hover:bg-gray-50 transition"
                      >
                        {/* TITLE */}
                        <td className="py-3 px-3 font-medium text-gray-800">
                          {title.slice(0, 50)}
                        </td>

                        {/* TYPE */}
                        <td className="py-3 px-3 text-gray-600">{item.type}</td>

                        {/* QTY */}
                        <td className="py-3 px-3 text-right tabular-nums">
                          {item.quantity}
                        </td>

                        {/* PRICE */}
                        <td className="py-3 px-3 text-right tabular-nums">
                          {/* {item.currency} {item.price.toFixed(2)} */}£
                          {item.currency} {item.price.toFixed(2)}
                        </td>

                        {/* TOTAL */}
                        <td className="py-3 px-3 text-right font-semibold tabular-nums">
                          {/* {item.currency}{" "} */}£
                          {(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          {/* CUSTOMER */}
          <Section title="Customer">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Name</div>
                <div>
                  {order.user.firstName} {order.user.lastName}
                </div>
              </div>

              <div>
                <div className="text-gray-500">Email</div>
                <div>{order.user.email}</div>
              </div>
            </div>
          </Section>

          {/* SHIPPING */}
          <Section title="Shipping Address">
            <div className="text-sm space-y-1">
              <div>{order.shippingAddress.name}</div>
              <div>{order.shippingAddress.phone}</div>
              <div>{order.shippingAddress.line1}</div>
              {order.shippingAddress.line2 && (
                <div>{order.shippingAddress.line2}</div>
              )}
              <div>
                {order.shippingAddress.city}, {order.shippingAddress.state}
              </div>
              <div>{order.shippingAddress.postalCode}</div>
              <div>{order.shippingAddress.country}</div>
            </div>
          </Section>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-6">
          {/* PAYMENT */}
          <Section title="Payment">
            <div className="space-y-2 text-sm">
              <div>
                Method: <strong>{order.payment.method}</strong>
              </div>

              <div>
                Status: <strong>{order.payment.status.toUpperCase()}</strong>
              </div>

              {order.payment.transactionId && (
                <div>Txn: {order.payment.transactionId}</div>
              )}
            </div>
          </Section>

          {/* TOTALS */}
          <Section title="Totals">
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
          </Section>

          {/* META */}
          <Section title="Metadata">
            <div className="text-sm space-y-1">
              <div>Created: {new Date(order.createdAt).toLocaleString()}</div>

              <div>Updated: {new Date(order.updatedAt).toLocaleString()}</div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;
