"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import AdminHeader from "@/components/admin/AdminHeader";
import ToggleSwitch from "@/components/custom/ToggleSwitch";

import {
  fetchAdminUsers,
  updateUserStatus,
  deleteAdminUser,
} from "@/store/adminUserSlice";

import { useRouter } from "next/navigation";
import AdminTable from "@/components/admin/AdminTable";

const LIMIT = 50;

// ======================================================
// TABLE COLUMNS
// ======================================================

const getColumns = ({ onToggleStatus }) => [
  { accessorKey: "firstName", header: "First Name" },
  { accessorKey: "lastName", header: "Last Name" },
  { accessorKey: "email", header: "Email" },
  // { accessorKey: "role", header: "Role" },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { _id, status } = row.original;

      return (
        <ToggleSwitch
          checked={status}
          onChange={() => onToggleStatus(_id, !status)}
        />
      );
    },
  },

  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
  },
];

// ======================================================
// PAGE
// ======================================================

const AdminUser = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const { list, page, totalPages, loading, error } = useSelector(
    (state) => state.adminUsers
  );

  const [search, setSearch] = useState("");

  // Initial Fetch
  useEffect(() => {
    dispatch(fetchAdminUsers({ page: 1, limit: LIMIT }));
  }, [dispatch]);

  // ---------------- Status Toggle ----------------
  const handleToggleStatus = (id, status) => {
    dispatch(updateUserStatus({ id, status }));
  };

  // ---------------- Delete ----------------
  const handleDelete = (row) => {
    if (!confirm("Delete this user permanently?")) return;
    dispatch(deleteAdminUser(row._id));
  };

  // ---------------- Pagination ----------------
  const handleNext = () => {
    if (page < totalPages) {
      dispatch(
        fetchAdminUsers({
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
        fetchAdminUsers({
          page: page - 1,
          limit: LIMIT,
          search,
        })
      );
    }
  };

  // ---------------- Search ----------------
  const handleSearch = (e) => {
    e.preventDefault();

    dispatch(
      fetchAdminUsers({
        page: 1,
        limit: LIMIT,
        search,
      })
    );
  };

  const columns = getColumns({
    onToggleStatus: handleToggleStatus,
  });

  // ---------------- Loading/Error ----------------
  if (loading) return <div className="p-6">Loading users...</div>;

  if (error) return <div className="p-6 text-red-500">{error}</div>;

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-6">
        <AdminHeader title="Users" />

        {/* Search */}
        <div className="flex items-center justify-between mb-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border px-3 py-2 rounded w-80"
            />

            <button
              type="submit"
              className="px-4 cursor-pointer py-2 border rounded hover:bg-gray-100"
            >
              Search
            </button>
          </form>

          {/* Add User Button */}
          <button
            onClick={() => router.push("/admin/users/create")}
            className="px-5 py-2 bg-[#FF6A00] text-white rounded hover:bg-[#de6005] transition cursor-pointer"
          >
            + Add New User
          </button>
        </div>

        {/* Table */}
        <AdminTable
          columns={columns}
          data={list}
          onEdit={(row) => router.push(`/admin/users/${row._id}`)}
          onDelete={handleDelete}
        />

        {/* Pagination */}
        <div className="flex justify-between mt-6">
          <div>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </div>

          <div className="flex gap-2">
            {page > 1 && (
              <button onClick={handlePrev} className="px-4 py-2 border rounded">
                ← Previous
              </button>
            )}

            {page < totalPages && (
              <button onClick={handleNext} className="px-4 py-2 border rounded">
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUser;
