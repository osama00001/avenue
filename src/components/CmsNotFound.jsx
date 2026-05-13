"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CmsNotFound() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center max-w-xl">
        <div className="text-7xl mb-4 animate-bounce">📚</div>

        <h1 className="text-4xl font-bold mb-2">Lost in the Library?</h1>

        <p className="text-gray-500 mb-8">
          The page you're looking for doesn’t exist — maybe it was misplaced
          between chapters.
        </p>

        {/* Search */}
        {/* <input
          placeholder="Search books..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              router.push(`/search?q=${query}`);
            }
          }}
          className="w-full border rounded-lg p-3 mb-6 focus:ring-2 focus:ring-black"
        /> */}

        {/* Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="bg-teal-700 hover:bg-teal-800 cursor-pointer text-white px-6 py-3 rounded-lg hover:scale-105 transition"
          >
            Browse Books
          </button>

          <button
            onClick={() => router.back()}
            className="border px-6 py-3 rounded-lg cursor-pointer hover:bg-gray-100 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
