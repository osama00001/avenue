"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

import { fetchAdminUsers, fetchSingleAdminUser, updateAdminUser } from "@/store/adminUserSlice";

import AdminHeader from "@/components/admin/AdminHeader";
import ToggleSwitch from "@/components/custom/ToggleSwitch";

// ================= Validation =================

const schema = Yup.object({
  firstName: Yup.string().required("Required"),
  lastName: Yup.string().required("Required"),

  email: Yup.string().email("Invalid email").required("Required"),

  password: Yup.string().min(6, "Min 6 characters").notRequired(),

  // role: Yup.string().required(),
  status: Yup.boolean(),
});

// ================= Page =================

const AdminUserDetails = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { id } = useParams();

  const { selectedUser, loading } = useSelector((state) => state.adminUsers);

  // Fetch user
  useEffect(() => {
    if (id) dispatch(fetchSingleAdminUser(id));
  }, [id, dispatch]);

  if (!selectedUser) return <div className="p-6">Loading...</div>;

  const initialValues = {
    firstName: selectedUser.firstName || "",
    lastName: selectedUser.lastName || "",
    email: selectedUser.email || "",
    password: "",
    // role: selectedUser.role || "user",
    status: selectedUser.status ?? true,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8 px-6">
        <AdminHeader title="Edit User" />

        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={schema}
          onSubmit={(values) => {
            const payload = { ...values };

            // Don't send empty password
            if (!payload.password) {
              delete payload.password;
            }

            dispatch(updateAdminUser({ id, data: payload }));
            dispatch(fetchAdminUsers());
            router.back();
          }}
        >
          {({ values, setFieldValue }) => (
            <Form className="bg-white shadow rounded p-6 space-y-4">
              {/* First Name */}
              <div>
                <Field
                  name="firstName"
                  placeholder="First Name"
                  className="w-full border p-2 rounded"
                />
                <ErrorMessage
                  name="firstName"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>

              {/* Last Name */}
              <div>
                <Field
                  name="lastName"
                  placeholder="Last Name"
                  className="w-full border p-2 rounded"
                />
                <ErrorMessage
                  name="lastName"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <Field
                  name="email"
                  placeholder="Email"
                  className="w-full border p-2 rounded"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>

              {/* Password */}
              <div>
                <Field
                  name="password"
                  type="password"
                  placeholder="New Password (optional)"
                  className="w-full border p-2 rounded"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>

              {/* Role */}
              {/* <div>
                <Field
                  as="select"
                  name="role"
                  className="w-full border p-2 rounded"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </Field>
              </div> */}

              {/* Status */}
              <label className="flex items-center gap-2">
                {/* <input
                  type="checkbox"
                  checked={values.status}
                  onChange={(e) =>
                    setFieldValue("status", e.target.checked)
                  }
                /> */}
                <ToggleSwitch
                  checked={values.status}
                  onChange={() => setFieldValue("status", !values.status)}
                />
                Active
              </label>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-teal-700 cursor-pointer hover:bg-teal-800 text-white rounded"
                >
                  Save Changes
                </button>

                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border cursor-pointer rounded"
                >
                  Cancel
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AdminUserDetails;
