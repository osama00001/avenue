"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCMSPages, deleteCMSPage } from "@/store/cmsSlice";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTable from "@/components/admin/AdminTable";;

export default function CMSAdmin() {
  const dispatch = useDispatch();
  const router = useRouter();

  const { list, loading, deleting, error } = useSelector((s) => s.cms);

  useEffect(() => {
    dispatch(fetchCMSPages());
  }, [dispatch]);

  /**
   * ===========================
   * Confirm Delete
   * ===========================
   */
  const handleDelete = (row) => {
    const confirm = window.confirm(`Delete page "${row.title}"?`);

    if (confirm) {
      dispatch(deleteCMSPage(row.slug));
    }
  };

  /**
   * ===========================
   * Table Columns
   * ===========================
   */
  const columns = [
    {
      header: "Title",
      accessorFn: (row) => row.title || "Untitled",
    },
    {
      header: "Slug",
      accessorFn: (row) => row.slug,
    },
    {
      header: "Level",
      accessorFn: (row) => row.level ?? 0,
    },
    {
      header: "Created",
      accessorFn: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-",
    },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        {/* <h1 className="text-2xl font-bold">CMS Pages</h1> */}
        <AdminHeader title="CMS Pages" />

        {/* <button
          onClick={() => router.push("/admin/cms/new")}
          className="
            bg-teal-700 hover:bg-teal-800
            text-white px-4 py-2 rounded
            cursor-pointer
          "
        >
          + Create Page
        </button> */}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-gray-500 p-6">Loading pages...</div>
      ) : list.length === 0 ? (
        <div className="text-gray-500 p-6 border rounded">
          No CMS pages created yet.
        </div>
      ) : (
        <AdminTable
          columns={columns}
          data={list}
          showView
          showEdit
          showDelete={false}
          onView={(r) => window.open(`/cms/${r.slug}`, "_blank")}
          onEdit={(r) => router.push(`/admin/cms/${r.slug}?id=${r?._id}`)}
          onDelete={handleDelete}
        />
      )}

      {/* Deleting indicator */}
      {deleting && (
        <div className="text-sm text-gray-500">Deleting page...</div>
      )}
    </div>
  );
}
