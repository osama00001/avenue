"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams, useParams } from "next/navigation";

import {
  createAdminBlog,
  updateAdminBlog,
  fetchAdminBlogs,
} from "@/store/blogAdminSlice";

import { fetchAdminBlogCategories } from "@/store/blogAdminCategorySlice";

import RichTextInput from "@/components/templates/blocks/RichTextInput";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * ================================
 * SLUGIFY
 * ================================
 */
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function BlogEditorPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const params = useParams();
  const search = useSearchParams();

  const blogId = params?.id;
  const isNew = blogId === "new";

  const categories = useSelector((s) => s.adminBlogCategories.list);
  const blogs = useSelector((s) => s.adminBlogs.list);

  const selectedBlog = blogs.find((b) => b._id === blogId);

  /**
   * ================================
   * LOCAL STATE
   * ================================
   */
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [manualSlug, setManualSlug] = useState(false);

  const [category, setCategory] = useState(search.get("category") || "");

  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");

  const [coverImage, setCoverImage] = useState("");

  const [published, setPublished] = useState(false);

  /**
   * ================================
   * LOAD DATA
   * ================================
   */
  useEffect(() => {
    dispatch(fetchAdminBlogCategories());
    dispatch(fetchAdminBlogs());
  }, [dispatch]);

  useEffect(() => {
    if (!isNew && selectedBlog) {
      setTitle(selectedBlog.title);
      setSlug(selectedBlog.slug);
      setExcerpt(selectedBlog.excerpt || "");
      setContent(selectedBlog.content || "");
      setCategory(selectedBlog.category?._id || selectedBlog.category);
      setCoverImage(selectedBlog.featuredImage || "");
      setPublished(selectedBlog.published);
    }
  }, [selectedBlog, isNew]);

  /**
   * ================================
   * SAVE
   * ================================
   */
  const save = async () => {
    const payload = {
      title,
      slug,
      category,
      excerpt,
      content,
      coverImage,
      published,
    };

    if (isNew) {
      await dispatch(createAdminBlog(payload));
    } else {
      await dispatch(updateAdminBlog({ id: blogId, data: payload }));
    }

    router.push("/admin/blog");
  };

  /**
   * ================================
   * UI
   * ================================
   */
  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {isNew ? "Create Blog" : "Edit Blog"}
        </h1>

        <Button
          onClick={save}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          Save Blog
        </Button>
      </div>

      {/* BASIC INFO */}
      <div className="bg-white border rounded-xl p-6 space-y-4">

        <Input
          placeholder="Blog Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!manualSlug) setSlug(slugify(e.target.value));
          }}
        />

        <Input
          placeholder="Slug"
          value={slug}
          onChange={(e) => {
            setSlug(slugify(e.target.value));
            setManualSlug(true);
          }}
        />

        {/* CATEGORY */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded p-2 w-full"
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <Input
          placeholder="Cover Image URL"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
        />

        <textarea
          placeholder="Short Excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="border rounded p-3 w-full min-h-[100px]"
        />

        {/* PUBLISH */}
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={published}
            onChange={() => setPublished(!published)}
          />
          Publish Blog
        </label>
      </div>

      {/* RICH TEXT EDITOR */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold mb-3">Content</h2>

        <RichTextInput
          key={content}
          value={content}
          onChange={setContent}
        />
      </div>

      {/* ================= LIVE PREVIEW ================= */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Live Preview</h2>

        <div className="max-w-3xl mx-auto space-y-6">

          {coverImage && (
            <img
              src={coverImage}
              alt="cover"
              className="w-full h-[280px] object-cover rounded-lg border"
            />
          )}

          <h1 className="text-3xl font-bold text-gray-900">
            {title || "Blog Title Preview"}
          </h1>

          {category && (
            <div className="text-sm text-orange-600 font-medium">
              {categories.find(c => c._id === category)?.name}
            </div>
          )}

          {excerpt && (
            <p className="text-gray-600 italic border-l-4 pl-4">
              {excerpt}
            </p>
          )}

          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: content || "<p>Content preview...</p>",
            }}
          />
        </div>
      </div>

    </div>
  );
}
