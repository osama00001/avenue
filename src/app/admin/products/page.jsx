"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import AdminHeader from "@/components/admin/AdminHeader";
import ToggleSwitch from "@/components/custom/ToggleSwitch";

import {
  deleteAdminBookProduct,
  fetchAdminProductBooks,
  updateAdminBookStatus,
} from "@/store/productSlice";
import { useRouter } from "next/navigation";
import AdminTable from "@/components/admin/AdminTable";

const LIMIT = 50;

// ---------------- Columns ----------------

const getProductColumns = ({ onToggleStatus }) => [
  {
    header: "ISBN",
    cell: ({ row }) => row.original.productIdentifiers?.[0]?.value || "-",
  },

  {
    header: "Title",
    cell: ({ row }) => {
      const title = row.original.descriptiveDetail?.titles?.[0]?.text || "-";

      return title.length > 30 ? `${title.slice(0, 30)}...` : title;
    },
  },

  {
    header: "Author",
    cell: ({ row }) => {
      const contributor = row.original.descriptiveDetail?.contributors?.find(
        (c) => c.role === "A01"
      );

      return contributor?.nameInverted || "-";
    },
  },

  {
    header: "Price",
    cell: ({ row }) => {
      const p = row.original.productSupply?.prices?.[0];
      // return p ? `${p.amount} ${p.currency}` : "-";
      return p ? `£${p.amount}` : "-";
    },
  },

  {
    header: "Publisher",
    cell: ({ row }) => row.original.publishingDetail?.publisher?.name || "-",
  },

  {
    header: "Published",
    cell: ({ row }) => {
      const raw = row.original.publishingDetail?.publishingDate;

      if (!raw) return "-";

      const formatted = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(
        6,
        8
      )}`;

      return new Date(formatted).toLocaleDateString();
    },
  },

  {
    header: "Status",
    cell: ({ row }) => {
      const { _id, isSellable } = row.original;

      return (
        <ToggleSwitch
          checked={isSellable}
          onChange={() => onToggleStatus(_id, !isSellable)}
        />
      );
    },
  },
];

// ---------------- Page ----------------

const AdminProducts = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { list, page, totalPages, loading, error } = useSelector(
    (state) => state.products
  );

  const [search, setSearch] = useState("");

  // Initial fetch
  useEffect(() => {
    dispatch(fetchAdminProductBooks({ page: 1, limit: LIMIT }));
  }, [dispatch]);

  // -------- Pagination --------

  const handleNext = () => {
    if (page < totalPages) {
      dispatch(
        fetchAdminProductBooks({
          page: page + 1,
          limit: LIMIT,
          search,
        })
      );
    }
  };

  const handlePrev = () => {
    if (page > 1) {
      dispatch(
        fetchAdminProductBooks({
          page: page - 1,
          limit: LIMIT,
          search,
        })
      );
    }
  };

  // -------- Search --------

  const handleSearch = (e) => {
    e.preventDefault();

    dispatch(
      fetchAdminProductBooks({
        page: 1,
        limit: LIMIT,
        search,
      })
    );
  };

  const handleDelete = (row) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this product?"
    );

    if (!confirmDelete) return;

    dispatch(deleteAdminBookProduct(row._id));
  };

  // -------- Toggle --------

  const handleToggleStatus = async (id, status) => {
    // console.log("-=-=--= status -=-=",status);
    // return;
    await dispatch(
      updateAdminBookStatus({
        id,
        status,
      })
    );
  };

  const columns = getProductColumns({
    onToggleStatus: handleToggleStatus,
  });

  // -------- Loading/Error --------

  if (loading) return <div className="p-6 text-gray-500">Loading…</div>;

  if (error) return <div className="p-6 text-red-500">{error}</div>;

  // -------- Render --------

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-6">
        <AdminHeader title="Products" />

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Search title / isbn / author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded w-80"
          />

          <button
            type="submit"
            className="px-4 py-2 border cursor-pointer rounded hover:bg-gray-100"
          >
            Search
          </button>
        </form>

        {/* Table */}
        <AdminTable
          columns={columns}
          data={list}
          showEdit={false}
          showView={true}
          onView={(row) => {
            router.push(`/admin/products/${row?._id}`);
          }}
          onEdit={(row) => console.log("EDIT", row)}
          onDelete={handleDelete}
        />

        {/* Pagination */}
        <div className="flex justify-between mt-6">
          <div className="text-sm text-gray-600">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </div>

          <div className="flex gap-2">
            {page > 1 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                ← Previous
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
    </div>
  );
};

export default AdminProducts;
