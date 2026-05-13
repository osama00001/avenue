"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";

/**
 * Highlights page — landing for the Header's "Highlights" link.
 *
 * Lists three sub-sections: Bestsellers, New Arrivals, Editor's Picks.
 * Each pulls from the existing /api/books endpoint with a section param.
 */

const SECTIONS = [
  { label: "Bestsellers",   slug: "bestsellers",       category: "bestsellers" },
  { label: "New Arrivals",  slug: "new-arrivals",      category: "popular" },
  { label: "Editor's Picks",slug: "editor-picks",      category: "special_editions" },
];

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

export default function HighlightsPage() {
  const [sections, setSections] = useState(SECTIONS.map(s => ({ ...s, books: [], loading: true })));

  useEffect(() => {
    (async () => {
      const next = await Promise.all(
        SECTIONS.map(async (s) => {
          try {
            const res = await api.get("/books", { params: { category: s.category, limit: 12, page: 1, nocoverfilter: 1 } });
            return { ...s, books: Array.isArray(res.data) ? res.data : [], loading: false };
          } catch {
            return { ...s, books: [], loading: false };
          }
        })
      );
      setSections(next);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-serif font-bold mb-2">Highlights</h1>
        <p className="text-gray-600 mb-10">
          Curated selections from our catalogue: bestsellers, new releases, and editor&apos;s picks.
        </p>

        {sections.map((sec) => (
          <section key={sec.slug} className="mb-12">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-2xl font-semibold">{sec.label}</h2>
              <Link href={`/category?category=${sec.category}`} className="text-[#FF6A00] text-sm hover:underline">
                See all →
              </Link>
            </div>

            {sec.loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[300px] bg-gray-200 animate-pulse rounded" />
                ))}
              </div>
            ) : sec.books.length === 0 ? (
              <p className="text-gray-500 italic">No books in this section yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {sec.books.slice(0, 12).map((book) => (
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
          </section>
        ))}
      </div>
    </div>
  );
}
