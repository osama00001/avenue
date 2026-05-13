"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";


/**
 * Single-section highlights page.
 *   /highlights/bestsellers    → category=bestsellers
 *   /highlights/new-arrivals   → category=popular
 *   /highlights/editor-picks   → category=special_editions
 */

const SLUG_TO_CATEGORY = {
  "bestsellers":   { label: "Bestsellers",       category: "bestsellers" },
  "new-arrivals":  { label: "New Arrivals",      category: "popular" },
  "editor-picks":  { label: "Editor's Picks",    category: "special_editions" },
};

function imageFor(book) {
  if (book?.coverImage) return book.coverImage;
  const id = book?._id || "";
  const idx = ((id.charCodeAt(id.length - 1) || 0) % 82) + 1;
  return `/img/placeholder/${idx}.jpg`;
}

function titleOf(book) {
  return book?.descriptiveDetail?.titles?.[0]?.text || "Untitled";
}

function priceOf(book) {
  const p = book?.productSupply?.prices?.[0];
  return p?.amount ? `£${Number(p.amount).toFixed(2)}` : null;
}

export default function HighlightsSectionPage({ params }) {
  const { slug } = use(params);
  const meta = SLUG_TO_CATEGORY[slug];

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!meta) { setLoading(false); return; }
    (async () => {
      try {
        const res = await api.get("/books", { params: { category: meta.category, limit: 60, page: 1, nocoverfilter: 1 } });
        setBooks(Array.isArray(res.data) ? res.data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (!meta) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-serif font-bold mb-4">Highlight not found</h1>
          <Link href="/highlights" className="text-[#FF6A00] hover:underline">← Back to Highlights</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <Link href="/highlights" className="text-sm text-gray-600 hover:underline">← Highlights</Link>
        <h1 className="text-4xl font-serif font-bold mt-3 mb-8">{meta.label}</h1>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-[300px] bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <p className="text-gray-500 italic">No books in this section yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {books.map((book) => (
              <Link key={book._id} href={`/${book._id}`} className="block group">
                <div className="relative w-full h-[260px] overflow-hidden bg-white rounded">
                  <Image
                    src={imageFor(book)}
                    alt={titleOf(book)}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                  />
                </div>
                <h3 className="text-sm font-semibold mt-2 leading-tight line-clamp-2">{titleOf(book)}</h3>
                {priceOf(book) && (
                  <p className="text-sm font-medium text-[#FF6A00]">{priceOf(book)}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
