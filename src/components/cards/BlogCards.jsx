"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function BlogEditorialCard({ blog }) {
  const router = useRouter();

  const goToBlog = () => {
    router.push(`/blog/${blog.slug}`);
  };

  return (
    <div
      onClick={goToBlog}
      className="
        cursor-pointer
        border border-gray-300
        shadow-sm hover:shadow-lg
        transition overflow-hidden
        bg-white
      "
    >
      {/* IMAGE GRID / HERO */}
      <div className="h-[220px] bg-gray-200 overflow-hidden">
        {blog.featuredImage ? (
          <img
            src={blog.featuredImage}
            alt={blog.title}
            className="w-full h-full object-cover hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No Image
          </div>
        )}
      </div>

      {/* TEXT AREA */}
      <div className="bg-[#efefef] p-6 relative">
        {/* TITLE */}
        <h3
          className="
            text-xl md:text-2xl
            font-serif italic
            leading-snug mb-3
          "
        >
          {blog.title}
        </h3>

        {/* EXCERPT */}
        <p className="text-gray-600 text-sm leading-relaxed pr-10">
          {blog.excerpt}
        </p>

        {/* CTA ARROW */}
        <button
          className="
            absolute bottom-6 right-6
            w-9 h-9 rounded-full
            bg-[#2b0d0d]
            flex items-center justify-center
            text-white
            hover:scale-110 transition
          "
        >
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
