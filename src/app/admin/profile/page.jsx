"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminProfile, updateAdminProfile } from "@/store/adminSlice";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { UserCircle, Lock, Mail, Save, XCircle, Pencil } from "lucide-react";

import { useFormik } from "formik";
import * as Yup from "yup";

export default function AdminProfilePage() {
  const dispatch = useDispatch();

  const { name, email, username, id, loading } = useSelector((s) => s.admin);

  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminProfile());
  }, [dispatch]);

  /**
   * ===============================
   * VALIDATION
   * ===============================
   */
  const validationSchema = Yup.object({
    name: Yup.string().required("Name required"),

    username: Yup.string()
      .min(3, "Minimum 3 characters")
      .required("Username required"),

    email: Yup.string().email("Invalid email").required("Email required"),

    password: Yup.string().min(6, "Min 6 characters").nullable(),
  });

  /**
   * ===============================
   * FORMIK
   * ===============================
   */
  const formik = useFormik({
    enableReinitialize: true,

    initialValues: {
      id,
      name: name || "",
      username: username || "",
      email: email || "",
      password: "",
    },

    validationSchema,

    onSubmit: async (values) => {
      await dispatch(updateAdminProfile(values));
      setEditMode(false);

      // Clear password field after save
      formik.setFieldValue("password", "");
    },
  });

  if (loading || !email) {
    return <p className="p-6 text-gray-600 text-lg">Loading profile...</p>;
  }

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200 mt-8"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <UserCircle size={50} className="text-blue-600" />
        <h2 className="text-3xl font-bold tracking-tight text-gray-800">
          Admin Profile
        </h2>
      </div>

      <div className="space-y-6">
        {/* NAME */}
        <div>
          <label className="flex items-center gap-2 font-medium">
            <UserCircle size={18} /> Full Name
          </label>

          <Input
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            disabled={!editMode}
            className={!editMode ? "bg-gray-100" : ""}
          />

          {formik.touched.name && formik.errors.name && (
            <p className="text-red-500 text-sm">{formik.errors.name}</p>
          )}
        </div>

        {/* USERNAME */}
        <div>
          <label className="flex items-center gap-2 font-medium">
            <UserCircle size={18} /> Username
          </label>

          <Input
            name="username"
            value={formik.values.username}
            onChange={formik.handleChange}
            disabled={!editMode}
            className={!editMode ? "bg-gray-100" : ""}
          />

          {formik.touched.username && formik.errors.username && (
            <p className="text-red-500 text-sm">{formik.errors.username}</p>
          )}
        </div>

        {/* EMAIL */}
        <div>
          <label className="flex items-center gap-2 font-medium">
            <Mail size={18} /> Email
          </label>

          <Input
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            disabled={!editMode}
            className={!editMode ? "bg-gray-100" : ""}
          />

          {formik.touched.email && formik.errors.email && (
            <p className="text-red-500 text-sm">{formik.errors.email}</p>
          )}
        </div>

        {/* PASSWORD */}
        <div>
          <label className="flex items-center gap-2 font-medium">
            <Lock size={18} /> Password
          </label>

          <Input
            name="password"
            type="password"
            placeholder="Leave blank to keep current password"
            value={formik.values.password}
            onChange={formik.handleChange}
            disabled={!editMode}
            className={!editMode ? "bg-gray-100" : ""}
          />

          {formik.touched.password && formik.errors.password && (
            <p className="text-red-500 text-sm">{formik.errors.password}</p>
          )}

          <p className="text-xs text-gray-500">
            Leave blank if you don’t want to change password.
          </p>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-4 justify-end mt-10">
        {!editMode ? (
          <Button
            type="button"
            onClick={() => setEditMode(true)}
            className="bg-[#ae0001] cursor-pointer hover:bg-[#811b1b] text-white"
          >
            <Pencil size={18} />
            Edit Profile
          </Button>
        ) : (
          <>
            <Button
              type="button"
              className="cursor-pointer"
              variant="outline"
              onClick={() => {
                setEditMode(false);
                formik.resetForm();
              }}
            >
              <XCircle size={18} />
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="bg-[#FF6A00] cursor-pointer hover:bg-[#e66306] text-white"
            >
              <Save size={18} />
              Save Changes
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
