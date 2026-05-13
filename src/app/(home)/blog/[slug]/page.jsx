"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";

import { fetchBlogBySlug, clearSelectedBlog } from "@/store/blogSlice";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BlogDetailPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();

  const slug = params.slug;

  const { selected, detailLoading } = useSelector((s) => s.blog);

  /**
   * ================= LOAD BLOG
   */
  useEffect(() => {
    if (slug) dispatch(fetchBlogBySlug(slug));

    return () => {
      dispatch(clearSelectedBlog());
    };
  }, [slug]);

  /**
   * ================= LOADING UI
   */
  if (detailLoading || !selected) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6">
        <div className="h-72 bg-gray-200 rounded-xl animate-pulse mb-6" />
        <div className="h-8 bg-gray-200 rounded mb-4 w-2/3 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  /**
   * ================= UI
   */
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="flex cursor-pointer items-center gap-2 text-sm text-gray-500 mb-6 hover:text-black"
      >
        <ArrowLeft size={16} />
        Back to Blogs
      </button>

      {/* IMAGE */}
      {selected.featuredImage && (
        <div className="mb-8 rounded-xl overflow-hidden">
          <img
            src={selected.featuredImage}
            alt={selected.title}
            className="w-full object-cover"
          />
        </div>
      )}

      {/* TITLE */}
      <h1 className="text-3xl md:text-4xl font-bold mb-3">{selected.title}</h1>

      {/* META */}
      <div className="text-sm text-gray-500 mb-8 flex gap-4 flex-wrap">
        <span>{new Date(selected.createdAt).toDateString()}</span>

        {selected.category?.name && (
          <span className="bg-gray-200 px-3 py-1 rounded-full">
            {selected.category.name}
          </span>
        )}
      </div>

      {/* CONTENT */}
      <div
        className="
          prose
          prose-lg
          max-w-none
        "
        dangerouslySetInnerHTML={{
          __html: selected.content,
        }}
      />
    </div>
  );
}
