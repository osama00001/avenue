"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminHeader from "@/components/admin/AdminHeader";;
import { fetchCategories, updateCategoryStatus } from "@/store/categorySlice";
import ToggleSwitch from "@/components/custom/ToggleSwitch";
import { useRouter } from "next/navigation";
import AdminTable from "@/components/admin/AdminTable";


export const getCategoryColumns = ({ onToggleStatus }) => [
  { accessorKey: "code", header: "Code" },
  // { accessorKey: "level", header: "Level" },
  { accessorKey: "scheme", header: "Scheme" },
  { accessorKey: "headingText", header: "Heading" },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { _id, scheme, status } = row.original;

      console.log("scheme", scheme, " status", status);

      return (
        <ToggleSwitch
          checked={status}
          onChange={() => onToggleStatus(_id, scheme, !status)}
        />
      );
    },
  },

  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
  },
];

const LIMIT = 50;

const AdminCategoriesPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [searchCode, setSearchCode] = useState("");
  const [searchScheme, setSearchScheme] = useState("");

  const { list, page, totalPages, loading, error } = useSelector(
    (state) => state.category
  );

  // Initial fetch
  useEffect(() => {
    dispatch(fetchCategories({ page: 1, limit: LIMIT }));
  }, [dispatch]);

  const handleToggleStatus = (id, scheme, status) => {
    dispatch(updateCategoryStatus({ id, scheme, status }));
  };

  const columns = getCategoryColumns({
    onToggleStatus: handleToggleStatus,
  });

  const handleNext = () => {
    if (page < totalPages) {
      dispatch(
        fetchCategories({
          page: page + 1,
          limit: LIMIT,
          code: searchCode,
          scheme: searchScheme,
        })
      );
    }
  };

  const handlePrev = () => {
    if (page > 1) {
      dispatch(
        fetchCategories({
          page: page - 1,
          limit: LIMIT,
          code: searchCode,
          scheme: searchScheme,
        })
      );
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading categories…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  const handleSearch = (e) => {
    e.preventDefault();

    dispatch(
      fetchCategories({
        page: 1,
        limit: LIMIT,
        code: searchCode,
        scheme: searchScheme,
      })
    );
  };

  return (
    <div className="p-6">
      {/* <h1 className="text-2xl font-semibold mb-4">Categories</h1> */}
      <AdminHeader title="Categories" />

      <form onSubmit={handleSearch} className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search code..."
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          className="border px-3 py-2 rounded w-56"
        />

        <input
          type="text"
          placeholder="Search scheme..."
          value={searchScheme}
          onChange={(e) => setSearchScheme(e.target.value)}
          className="border px-3 py-2 rounded w-56"
        />

        <button
          type="submit"
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Search
        </button>
      </form>

      <AdminTable
        columns={columns}
        data={list}
        onEdit={(row) => {
          router.push(
            `/admin/category/${row._id}?scheme=${encodeURIComponent(
              row.scheme
            )}`
          );
        }}
        onDelete={(row) => console.log("DELETE:", row)}
        onToggleStatus={(row) => console.log("TOGGLE STATUS:", row)}
      />

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-600">
          Page <strong>{page}</strong> of <strong>{totalPages}</strong>
        </div>

        <div className="flex gap-2">
          {/* Previous */}
          {page > 1 && (
            <button
              onClick={handlePrev}
              className="px-4 py-2 border cursor-pointer rounded text-sm hover:bg-gray-100"
            >
              ← Previous
            </button>
          )}

          {/* Next */}
          {page < totalPages && (
            <button
              onClick={handleNext}
              className="px-4 py-2 cursor-pointer border rounded text-sm hover:bg-gray-100"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCategoriesPage;
