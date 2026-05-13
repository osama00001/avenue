"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";

import {
  fetchAdminBlogCategories,
  deleteAdminBlogCategory,
} from "@/store/blogAdminCategorySlice";

import {
  fetchAdminBlogs,
  deleteAdminBlog,
} from "@/store/blogAdminSlice";

import {
  ChevronDown,
  ChevronRight,
  Folder,
  FileText,
  Trash2,
  Pencil,
  Plus,
} from "lucide-react";

import EmptyState from "@/components/EmptyState";

export default function BlogAdminPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const categories = useSelector((s) => s.adminBlogCategories.list);
  const blogs = useSelector((s) => s.adminBlogs.list);

  const [openCategory, setOpenCategory] = useState(null);

  /**
   * ================= LOAD
   */
  useEffect(() => {
    dispatch(fetchAdminBlogCategories());
    dispatch(fetchAdminBlogs());
  }, [dispatch]);

  /**
   * ================= HELPERS
   */
  const getBlogs = (catId) =>
    blogs.filter(
      (b) =>
        b.category === catId ||
        b.category?._id === catId
    );

  const toggle = (id) => {
    setOpenCategory((prev) => (prev === id ? null : id));
  };

  /**
   * ================= UI
   */
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Blog
        </h1>

        <button
          onClick={() => router.push("/admin/blog/categories/new")}
          className="flex cursor-pointer items-center gap-2 bg-[#FF6A00] hover:bg-[#e55e00] text-white px-4 py-2 rounded"
        >
          <Plus size={16} />
          Create Category
        </button>
      </div>

      {/* EMPTY */}
      {categories.length === 0 && (
        <EmptyState
          icon={Folder}
          title="No Blog Categories"
          description="Create your first category to begin writing blogs."
          actionLabel="Create Category"
          onAction={() =>
            router.push("/admin/blog/categories/new")
          }
        />
      )}
      {/* commiting */}

      {/* CATEGORY LIST */}
      <div className="space-y-3">

        {categories.map((cat) => {
          const catBlogs = getBlogs(cat._id);
          const isOpen = openCategory === cat._id;

          return (
            <div
              key={cat._id}
              className="border rounded-xl bg-white shadow-sm"
            >
              {/* CATEGORY HEADER */}
              <div
                onClick={() => toggle(cat._id)}
                className="
                  flex justify-between items-center
                  px-4 py-3 cursor-pointer
                  hover:bg-gray-50 rounded-xl
                "
              >
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}

                  <Folder size={18} />

                  <span className="font-medium">
                    {cat.name}
                  </span>

                  {!cat.enabled && (
                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                      Disabled
                    </span>
                  )}
                </div>

                {/* CATEGORY ACTIONS */}
                <div className="flex gap-3">
                  <Pencil
                    size={16}
                    className="cursor-pointer text-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/admin/blog/categories/${cat._id}`
                      );
                    }}
                  />

                  <Trash2
                    size={16}
                    className="cursor-pointer text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(deleteAdminBlogCategory(cat._id));
                    }}
                  />
                </div>
              </div>

              {/* BLOG DROPDOWN */}
              {isOpen && (
                <div className="border-t px-6 py-4 space-y-3">

                  {catBlogs.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title="No Blogs"
                      description="Create your first blog in this category."
                      actionLabel="Create Blog"
                      onAction={() =>
                        router.push(
                          `/admin/blog/new?category=${cat._id}`
                        )
                      }
                    />
                  ) : (
                    <div className="space-y-2">
                      {catBlogs.map((blog) => (
                        <div
                          key={blog._id}
                          className="
                            flex justify-between items-center
                            border rounded-lg px-3 py-2
                            hover:bg-gray-50
                          "
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={16} />

                            <div>
                              <div className="font-medium">
                                {blog.title}
                              </div>

                              <div className="text-xs text-gray-500">
                                {blog.slug}
                              </div>
                            </div>
                          </div>

                          {/* BLOG ACTIONS */}
                          <div className="flex gap-3">
                            <Pencil
                              size={16}
                              className="cursor-pointer text-blue-600"
                              onClick={() =>
                                router.push(
                                  `/admin/blog/${blog._id}`
                                )
                              }
                            />

                            <Trash2
                              size={16}
                              className="cursor-pointer text-red-600"
                              onClick={() =>
                                dispatch(
                                  deleteAdminBlog(blog._id)
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CREATE BLOG BUTTON */}
                  <div className="pt-2">
                    <button
                      onClick={() =>
                        router.push(
                          `/admin/blog/new?category=${cat._id}`
                        )
                      }
                      className="
                        w-full border border-dashed
                        border-orange-400
                        text-orange-600
                        py-2 rounded-lg
                        hover:bg-orange-50
                        flex items-center
                        justify-center gap-2
                      "
                    >
                      <Plus size={16} />
                      Create Blog
                    </button>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
