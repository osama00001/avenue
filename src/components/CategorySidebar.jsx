"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const FRIENDLY_CATEGORIES = [
  { name: "BESTSELLERS", slug: "bestsellers", matches: ["bestsellers", "H"] },
  { name: "NEW BOOKS", slug: "popular", matches: ["popular"] },
  { name: "HIGHLIGHTS", slug: "recently_reviewed", matches: ["recently_reviewed"] },
  { name: "FICTION", slug: "fiction", matches: ["fiction", "F"] },
  { name: "CHILDREN'S", slug: "children_books", matches: ["children_books", "Y"] },
  { name: "LANGUAGE", slug: "adult_books", matches: ["adult_books", "language", "C", "D", "E"] },
  { name: "GAMES", slug: "gift_books", matches: ["gift_books", "games", "W"] },
  { name: "E-BOOKS", slug: "ebooks", matches: ["ebooks"] },
];

const CategorySidebar = () => {
  const pathname = usePathname();
  const categoryParam = pathname.split("/category/")[1]?.split("/")[0] || "";
  const categoryParamLower = categoryParam.toLowerCase();
  const isKnownSlug = FRIENDLY_CATEGORIES.some((cat) => {
    const matches = cat.matches || [cat.slug];
    return matches.some((match) => {
      if (!match || match.length === 1) return false;
      return match.toLowerCase() === categoryParamLower;
    });
  });
  const isBicCode =
    !isKnownSlug && /^[A-Za-z][A-Za-z0-9]{0,5}$/.test(categoryParam);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6 hidden lg:block h-fit sticky top-24">
      <h3 className="text-xs font-black text-gray-400 tracking-[0.2em] mb-8 uppercase">Catalog</h3>
      <ul className="space-y-5">
        {FRIENDLY_CATEGORIES.map((cat) => {
          const matches = cat.matches || [cat.slug];
          const isActive = matches.some((match) => {
            if (!match) return false;
            if (match.length === 1) {
              return (
                isBicCode &&
                categoryParam.toUpperCase().startsWith(match.toUpperCase())
              );
            }
            return categoryParam.toLowerCase() === match.toLowerCase();
          });
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
