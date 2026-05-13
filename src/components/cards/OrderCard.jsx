"use client";

import { useRouter } from "next/navigation";

const statusColors = {
  placed: "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrderCard({ order }) {
  const router = useRouter();

  return (
    <div className="bg-white border rounded-2xl shadow-sm hover:shadow-md transition p-6">
      {/* HEADER */}
      <div className="flex justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="text-xs text-gray-500 uppercase">Order #</div>
          <div className="font-mono text-sm font-semibold">
            {order.orderNumber}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 uppercase">Date</div>
          <div className="text-sm">
            {new Date(order.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 uppercase">Total</div>
          <div className="font-semibold">£{order.total.toFixed(2)}</div>
        </div>

        {/* STATUS */}
        <div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize
            ${statusColors[order.status] || "bg-gray-100 text-gray-700"}`}
          >
            {order.status}
          </span>
        </div>
      </div>

      {/* ITEMS PREVIEW */}
      <div className="border-t pt-4 mb-4 space-y-1 text-sm text-gray-600">
        {order.items.slice(0, 2).map((item, i) => (
          <div key={i}>
            {item.title} × {item.quantity}
          </div>
        ))}

        {order.items.length > 2 && (
          <div className="text-xs text-gray-400">
            +{order.items.length - 2} more items
          </div>
        )}
      </div>

      {/* ACTION */}
      <div className="flex justify-end">
        <button
          onClick={() => router.push(`/account/orders/${order._id}`)}
          className="text-sm bg-teal-600 text-white px-4 py-2 cursor-pointer rounded-lg hover:bg-teal-700 transition"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
