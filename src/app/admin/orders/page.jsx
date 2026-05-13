"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";;
import { fetchAdminOrders } from "@/store/adminOrderSlice";
import AdminTable from "@/components/admin/AdminTable";

// ======================================================
// STATUS BADGE
// ======================================================

const StatusBadge = ({ status }) => {
  const styles = {
    placed: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-2 py-1 text-xs rounded-full font-medium ${
        styles[status.toLowerCase()] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status.toUpperCase()}
    </span>
  );
};

// ======================================================
// COLUMNS
// ======================================================

const getColumns = () => [
  {
    header: "Order #",
    cell: ({ row }) => row.original.orderNumber,
  },
  {
    header: "Customer",
    cell: ({ row }) =>
      `${row.original.user?.firstName || ""} ${
        row.original.user?.lastName || ""
      }`,
  },
  {
    header: "Items",
    cell: ({ row }) => row.original.items.length,
  },
  {
    header: "Total",
    cell: ({ row }) => `£${row.original.total.toFixed(2)}`,
  },
  {
    header: "Payment",
    cell: ({ row }) => row.original.payment.method,
  },
  {
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={row.original.status.toUpperCase()} />
    ),
  },
  {
    header: "Created",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
];

// ======================================================
// PAGE
// ======================================================

const AdminOrders = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const { list, page, totalPages, loading } = useSelector((s) => s.adminOrders);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // Fetch Orders
  useEffect(() => {
    dispatch(fetchAdminOrders({ page: 1 }));
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();

    dispatch(
      fetchAdminOrders({
        page: 1,
        search,
        status,
      })
    );
  };

  const handleNext = () => {
    if (page < totalPages)
      dispatch(fetchAdminOrders({ page: page + 1, search, status }));
  };

  const handlePrev = () => {
    if (page > 1)
      dispatch(fetchAdminOrders({ page: page - 1, search, status }));
  };

  if (loading)
    return <div className="p-8 text-gray-500">Loading orders...</div>;

  return (
    <div className="p-6 space-y-5">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        {/* <h1 className="text-2xl font-semibold">Orders Management</h1> */}
        <AdminHeader title="Order Management" />
      </div>

      {/* SEARCH / FILTER */}
      <form onSubmit={handleSearch} className="flex gap-3 items-center">
        <input
          type="text"
          placeholder="Search order number / customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-72"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border cursor-pointer px-3 py-2 rounded"
        >
          <option value="">All Status</option>
          <option value="placed">Placed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button
          type="submit"
          className="px-4 py-2 border cursor-pointer rounded hover:bg-gray-100"
        >
          Search
        </button>
      </form>

      {/* TABLE */}
      <AdminTable
        columns={getColumns()}
        data={list}
        showView
        showEdit={false}
        showDelete={false}
        onView={(row) => router.push(`/admin/orders/${row._id}`)}
      />

      {/* PAGINATION */}
      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-gray-600">
          Page <strong>{page}</strong> of <strong>{totalPages}</strong>
        </div>

        <div className="flex gap-2">
          {page > 1 && (
            <button
              onClick={handlePrev}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              ← Prev
            </button>
          )}

          {page < totalPages && (
            <button
              onClick={handleNext}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
