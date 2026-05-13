"use client";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";

import UserForm from "@/components/forms/AdminUserCreate";
import AdminHeader from "@/components/admin/AdminHeader";

import { createAdminUser, fetchAdminUsers } from "@/store/adminUserSlice";

const CreateUser = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const { loading } = useSelector((state) => state.adminUsers);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-10 px-6">
        {/* Header */}
        <AdminHeader title="Create User" />

        <p className="text-gray-500 mb-6">
          Add a new user account to the system. You can update permissions
          later.
        </p>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <UserForm
            loading={loading}
            initialValues={{
              firstName: "",
              lastName: "",
              email: "",
              password: "",
              status: true,
            }}
            submitLabel="Create User"
            onSubmit={(payload) => {
              dispatch(createAdminUser(payload));
              dispatch(fetchAdminUsers());
              router.push("/admin/users");
            }}
          />

          {/* Footer Actions */}
          <div className="mt-4 border-t pt-4 flex justify-end">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateUser;
