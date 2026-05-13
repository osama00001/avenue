"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";

import { fetchBlogs, fetchBlogCategories } from "@/store/blogSlice";

import { Button } from "@/components/ui/button";
import BlogCard from "@/components/cards/BlogCards";

/**
 * =========================================
 * BLOG PAGE
 * =========================================
 */
export default function BlogPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const { list, categories, loading, categoryLoading } = useSelector(
    (s) => s.blog
  );

  const [selectedCategory, setSelectedCategory] = useState("");

  /**
   * =========================================
   * LOAD DATA
   * =========================================
   */
  useEffect(() => {
    dispatch(fetchBlogs());
    dispatch(fetchBlogCategories());
  }, [dispatch]);

  /**
   * =========================================
   * FILTERED BLOGS
   * =========================================
   */
  const filteredBlogs = selectedCategory
    ? list.filter(
        (b) =>
          b.category === selectedCategory ||
          b.category?._id === selectedCategory
      )
    : list;

  /**
   * =========================================
   * UI
   * =========================================
   */
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold">Blogs</h1>

        {/* CATEGORY FILTER */}
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <Button
            size="sm"
            variant={!selectedCategory ? "default" : "outline"}
            onClick={() => setSelectedCategory("")}
          >
            All
          </Button>

          {!categoryLoading &&
            categories.map((c) => (
              <Button
                key={c._id}
                size="sm"
                variant={selectedCategory === c._id ? "default" : "outline"}
                onClick={() => setSelectedCategory(c._id)}
              >
                {c.name}
              </Button>
            ))}
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-60 rounded-xl bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* EMPTY */}
      {!loading && filteredBlogs.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <div className="text-xl mb-2">No blogs found</div>
          Try another category
        </div>
      )}

      {/* BLOG GRID */}
      {!loading && filteredBlogs.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <BlogCard key={blog._id} blog={blog} />
          ))}
        </div>
      )}
    </div>
  );
}
