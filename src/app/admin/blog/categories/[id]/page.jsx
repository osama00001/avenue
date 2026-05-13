"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useParams } from "next/navigation";

import {
  createAdminBlogCategory,
  fetchAdminBlogCategories,
  updateAdminBlogCategory,
} from "@/store/blogAdminCategorySlice";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ToggleSwitch from "@/components/custom/ToggleSwitch";
import AdminHeader from "@/components/admin/AdminHeader";

/**
 * ===============================
 * SLUG HELPER
 * ===============================
 */
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function BlogCategoryEditor() {
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();

  const categoryId = params?.id;
  const isNew = categoryId === "new";

  const categories = useSelector((s) => s.adminBlogCategories.list);

  const selected = categories.find((c) => c._id === categoryId);

  /**
   * ===============================
   * LOCAL STATE
   * ===============================
   */
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [manualSlug, setManualSlug] = useState(false);
  const [enabled, setEnabled] = useState(true);

  /**
   * ===============================
   * LOAD
   * ===============================
   */
  useEffect(() => {
    dispatch(fetchAdminBlogCategories());
  }, [dispatch]);

  useEffect(() => {
    if (!isNew && selected) {
      setName(selected.name);
      setSlug(selected.slug);
      setEnabled(selected.enabled);
    }
  }, [selected, isNew]);

  /**
   * ===============================
   * SAVE
   * ===============================
   */
  const save = async () => {
    const payload = { name, slug, enabled };

    if (isNew) {
      await dispatch(createAdminBlogCategory(payload));
    } else {
      await dispatch(
        updateAdminBlogCategory({
          id: categoryId,
          data: payload,
        })
      );
    }

    router.push("/admin/blog");
  };

  /**
   * ===============================
   * UI
   * ===============================
   */
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      {/* HEADER */}
      <AdminHeader title="Blog Category" />

      {/* CARD */}
      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6">
        {/* NAME */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Category Name</label>

          <Input
            value={name}
            placeholder="Engineering"
            onChange={(e) => {
              const val = e.target.value;
              setName(val);

              if (!manualSlug) {
                setSlug(slugify(val));
              }
            }}
          />
        </div>

        {/* SLUG */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Slug</label>

          <Input
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setManualSlug(true);
            }}
          />
        </div>

        {/* ENABLE SWITCH */}
        <div className="flex items-center justify-between border rounded-lg px-4 py-4">
          <div>
            <div className="font-medium">Visibility</div>

            <div className="text-sm text-gray-500">
              Toggle category visibility on storefront
            </div>
          </div>

          <ToggleSwitch checked={enabled} onChange={setEnabled} />
        </div>
        <div>
          <Button
            onClick={save}
            className="bg-[#FF6A00] hover:bg-[#e55e00] cursor-pointer text-white"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
