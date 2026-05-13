"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const FRIENDLY_CATEGORIES = [
  { name: "BESTSELLERS", slug: "bestsellers" },
  { name: "NEW BOOKS", slug: "popular" },
  { name: "HIGHLIGHTS", slug: "recently_reviewed" },
  { name: "FICTION", slug: "fiction" },
  { name: "CHILDREN'S", slug: "children_books" },
  { name: "LANGUAGE", slug: "adult_books" },
  { name: "GAMES", slug: "gift_books" }
];

const CategorySidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6 hidden lg:block h-fit sticky top-24">
      <h3 className="text-xs font-black text-gray-400 tracking-[0.2em] mb-8 uppercase">Catalog</h3>
      <ul className="space-y-5">
        {FRIENDLY_CATEGORIES.map((cat) => {
          const isActive = pathname.includes(`/category/${cat.slug}`);
          return (
            <li key={cat.slug}>
              <Link
                href={`/category/${cat.slug}`}
                className={`block text-sm font-bold tracking-tight transition-all duration-200 hover:text-[#FF6A00] hover:translate-x-1
                ${isActive ? "text-[#FF6A00] border-l-2 border-[#FF6A00] pl-3 -ml-3" : "text-gray-900"}`}
              >
                {cat.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default CategorySidebar;
