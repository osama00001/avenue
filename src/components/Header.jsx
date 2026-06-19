"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  faLocationDot,
  faUser,
  faCartShopping,
  faChevronDown,
  faBars,
  faTimes,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fetchBooksForHome, setReduxSearchText } from "@/store/bookSlice";
import { fetchCart } from "@/store/cartSlice";
import HeaderUser from "./cards/HeaderUser";
import { fetchCategories } from "@/store/categorySlice";
import { map } from "zod";
import { fetchUserCategories } from "@/store/userCategorySlice";
import { fetchNavigation } from "@/store/navigationSlice";
import { getStrapiMediaUrl } from "@/lib/strapi";

export default function Header() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { items = [], loading } = useSelector((state) => state.cart);
  const { user, loading: userLoading } = useSelector((state) => state?.user);
  const [hoveredDropdown, setHoveredDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [siteSettings, setSiteSettings] = useState(null);
  const { categories } = useSelector((state) => state?.userCategory);
  const { data: navigation } = useSelector((state) => state?.navigation || {});

  useEffect(() => {
    dispatch(fetchUserCategories({ page: 1 }));
    dispatch(fetchNavigation());
  }, [dispatch]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/strapi/site-settings");
        if (!res.ok) return;
        const payload = await res.json();
        const entry = payload?.data;
        const attributes = entry?.attributes ?? entry;
        if (attributes) {
          setSiteSettings({ id: entry?.id, ...attributes });
        }
      } catch (err) {
        console.error("[header] failed to load site settings", err);
      }
    };

    loadSettings();
  }, []);

  const fallbackMainMenu = [
    { label: "Bestsellers", href: "/category/H" },        // H = Humanities/Religion (Bibles)
    { label: "New Books", href: "/category/popular" },   // semantic slug = recent publishing
    { label: "Highlights", href: "/highlights", enableMegaMenu: true },       // Has mega menu
    { label: "Fiction", href: "/category/F" },           // F = Fiction (not A!)
    { label: "Children's", href: "/category/Y" },        // Y = Children's
    { label: "Language", href: "/category/C" },        // C = Language
    { label: "Games", href: "/category/W" },           // W = Lifestyle/Sport/Leisure (games, puzzles)
    { label: "E-BOOK", href: "/category/ebooks" },
  ];

  const fallbackUtilityMenu = [
    { label: "Shop Finder", href: "/shops", icon: faLocationDot },
    { label: "Help", href: "/help" },
    { label: "Events", href: "/events" },
    { label: "Blog", href: "/blog" },
    { label: "Gift Cards", href: "/gift-cards" },
    { label: "Win", href: "/win" },
  ];

  const mainMenu =
    navigation?.mainMenu && navigation.mainMenu.length
      ? navigation.mainMenu
      : fallbackMainMenu;
  const utilityMenu =
    navigation?.utilityMenu && navigation.utilityMenu.length
      ? navigation.utilityMenu
      : fallbackUtilityMenu;
  const ebookMenuItem = { label: "E-BOOK", href: "/category/ebooks" };
  const ensureEbookMenuItem = (menu) => {
    if (!Array.isArray(menu) || menu.length === 0) return [ebookMenuItem];
    const hasEbook = menu.some((item) => /e-?book/i.test(item?.label || ""));
    if (hasEbook) return menu;
    const gamesIndex = menu.findIndex((item) => /games/i.test(item?.label || ""));
    const insertIndex = gamesIndex >= 0 ? gamesIndex + 1 : menu.length;
    const nextMenu = [...menu];
    nextMenu.splice(insertIndex, 0, ebookMenuItem);
    return nextMenu;
  };
  const menuWithEbook = ensureEbookMenuItem(mainMenu);

  const resolveIcon = (icon) => {
    if (!icon) return null;
    if (typeof icon === "object") return icon;

    const iconMap = {
      faLocationDot,
    };

    return iconMap[icon] || null;
  };

  const saleBarText = siteSettings?.saleBarText || "SALE";
  const saleBarLink = siteSettings?.saleBarLink || "#";
  const deliveryText =
    siteSettings?.deliveryText ||
    "Free UK delivery on orders over £25, otherwise £2.99";
  const logoUrl =
    getStrapiMediaUrl(siteSettings?.logo?.data?.attributes?.url) ||
    "/img/avenuemain.png";
  const logoAlt =
    siteSettings?.logo?.data?.attributes?.alternativeText || "Logo";

  const toggleMobileDropdown = (key) => {
    setMobileDropdownOpen(mobileDropdownOpen === key ? null : key);
  };

  const handleSearch = () => {
    const q = searchText.trim();
    if (!q) return;
    dispatch(setReduxSearchText(q));
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const level1Categories = (categories || []).filter((cat) => cat.level === 1);

  // Split array into N columns
  const chunkIntoColumns = (arr, cols) => {
    if (!arr.length) return [];

    const perCol = Math.ceil(arr.length / cols);

    return Array.from({ length: cols }, (_, i) =>
      arr.slice(i * perCol, (i + 1) * perCol)
    );
  };

  const categoryColumns = chunkIntoColumns(level1Categories, 3);

  return (
    <header className="w-full  flex flex-col bg-white">
      {/* SALE BAR */}
      <div className="bg-[#FF6A00] flex items-center justify-center text-white text-center py-1 text-xs sm:text-sm font-semibold">
        <span className="mr-2 sm:mr-4 text-xl sm:text-3xl font-cursive">
          {saleBarText}
        </span>
        <Link href={saleBarLink} className="underline text-[8px] sm:text-[10px]">
          SHOP NOW
        </Link>
      </div>

      {/* UTILITY BAR - HIDDEN ON MOBILE */}
      <div className="hidden lg:flex justify-end items-center px-4 lg:px-6 py-2 text-sm">
        <div className="flex gap-3 lg:gap-4 text-gray-700 text-xs lg:text-sm">
          {/* ACCOUNT DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredDropdown("account")}
            onMouseLeave={() => setHoveredDropdown(null)}
          >
            <button className="hover:underline border-r border-slate-300 pr-2 lg:pr-3 flex items-center gap-1 transition">
              <FontAwesomeIcon icon={faUser} className="w-3 h-3" /> Account
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`w-3 h-3  transition ${
                  hoveredDropdown === "account" ? "rotate-180" : ""
                }`}
              />
            </button>

            {user && !userLoading ? (
              <HeaderUser hoveredDropdown={hoveredDropdown} />
            ) : (
              <div
                className={`absolute top-full right-0 mt-0 w-48 bg-white border border-slate-200 rounded shadow-lg transition-all duration-200 origin-top ${
                  hoveredDropdown === "account"
                    ? "opacity-100 visible scale-y-100"
                    : "opacity-0 invisible scale-y-95"
                }`}
              >
                <Link
                  href="/auth/user/login"
                  className="block px-4 py-3 hover:bg-slate-50 border-b border-slate-100 text-gray-700 font-medium text-sm"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/user/register"
                  className="block px-4 py-3 hover:bg-slate-50 text-gray-700 font-medium text-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LOGO & MOBILE HEADER */}
      <div className="py-3 sm:py-4 lg:py-6 text-center flex justify-between lg:justify-center items-center px-4">
        <button
          className="lg:hidden text-[#FF6A00]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <FontAwesomeIcon
            icon={mobileMenuOpen ? faTimes : faBars}
            className="w-6 h-6"
          />
        </button>

        <a href="/">
          <img
            src={logoUrl}
            alt={logoAlt}
            className="h-8 sm:h-10 lg:h-12 w-auto"
          />
        </a>

        <div className="flex lg:hidden gap-3 items-center">
          <button
            className="text-[#FF6A00]"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <FontAwesomeIcon icon={faSearch} className="w-5 h-5" />
          </button>
          <Link href="/wishlist" className="text-[#FF6A00]">
            <img src="/img/heart.webp" className="w-5 h-5" alt="Wishlist" />
          </Link>
          <div className="flex flex-col text-[#FF6A00] items-center gap-0.5 cursor-pointer text-xs">
            <FontAwesomeIcon icon={faCartShopping} />
            <span className="font-medium">0</span>
          </div>
        </div>
      </div>

      {/* MOBILE SEARCH BAR */}
      {searchOpen && (
        <div className="lg:hidden px-4 pb-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex border rounded overflow-hidden bg-[#eaeff2]"
          >
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search..."
              className="px-3 text-slate-900 py-2 text-sm flex-1 outline-none"
            />
            <button type="submit" className="px-3">
              <FontAwesomeIcon
                icon={faSearch}
                className="w-4 h-4 text-[#FF6A00]"
              />
            </button>
          </form>
        </div>
      )}

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <nav className="lg:hidden border-t text-[#000] border-slate-200 px-4 py-4 space-y-2">
          {menuWithEbook.map((item) => {
            const isDropdownMenu = item.enableMegaMenu || item.label === "Highlights";
            const dropdownKey = (item.label || "menu").toLowerCase();

            return (
              <div key={item.label}>
                <button
                  onClick={() =>
                    isDropdownMenu && toggleMobileDropdown(dropdownKey)
                  }
                  className="w-full text-left flex items-center justify-between py-2 px-3 rounded hover:bg-slate-100 text-[#FF6A00] font-medium text-sm"
                >
                  {item.label}
                  {isDropdownMenu && (
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`w-3 h-3 transition ${
                        mobileDropdownOpen === dropdownKey ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>

                {/* MOBILE SUBMENU */}
                {isDropdownMenu && mobileDropdownOpen === dropdownKey && (
                  <div className="pl-4 space-y-1">
                    <Link
                      href="/highlights/bestsellers"
                      className="block py-2 px-3 text-gray-600 text-xs hover:bg-slate-50 rounded"
                    >
                      Bestsellers
                    </Link>
                    <Link
                      href="/highlights/new-arrivals"
                      className="block py-2 px-3 text-gray-600 text-xs hover:bg-slate-50 rounded"
                    >
                      New Arrivals
                    </Link>
                    <Link
                      href="/highlights/editor-picks"
                      className="block py-2 px-3 text-gray-600 text-xs hover:bg-slate-50 rounded"
                    >
                      Editor's Picks
                    </Link>
                  </div>
                )}
              </div>
            );
          })}

          {/* MOBILE UTILITY MENU */}
          <div className="border-t border-slate-200 pt-4 mt-4 space-y-2">
            {utilityMenu.map((item) => (
              <Link
                key={item.label}
                href={item.href || "#"}
                className="flex items-center gap-2 py-2 px-3 rounded hover:bg-slate-100 text-gray-700 text-xs"
              >
                {resolveIcon(item.icon) && (
                  <FontAwesomeIcon icon={resolveIcon(item.icon)} className="w-4 h-4" />
                )}
                {item.label}
              </Link>
            ))}
          </div>

          {/* MOBILE AUTH BUTTONS */}
          <div className="border-t border-slate-200 pt-4 mt-4 space-y-2">
            <Link
              href="/auth/user/login"
              className="block w-full py-2 px-3 rounded bg-[#FF6A00] text-white text-center font-medium text-sm hover:bg-[#2a5560]"
            >
              Sign In
            </Link>
            <Link
              href="/auth/user/register"
              className="block w-full py-2 px-3 rounded border border-[#FF6A00] text-[#FF6A00] text-center font-medium text-sm hover:bg-slate-50"
            >
              Register
            </Link>
          </div>
        </nav>
      )}

      {/* DESKTOP NAV + SEARCH */}
      <div className="hidden self-center w-[99%] px-38 lg:flex items-center gap-6 py-3 border-y border-slate-200">
        {/* MENU */}

        <nav className="flex gap-6  text-[14px] uppercase font-medium text-[#000]">
          {menuWithEbook.map((item, index) => {
            const isDropdownMenu = item.enableMegaMenu || item.label === "Highlights";
            const dropdownKey = item.label || "Highlights";

            return (
              <div
                key={item.label}
                className="relative group" // 🔥 group wrapper keeps hover stable
              >
                {/* MAIN MENU BUTTON */}
                <Link
                  href={item.href || "#"}
                  className={`relative flex items-center gap-1 whitespace-nowrap transition
    group-hover:text-[#FF6A00]
    ${
      index !== menuWithEbook.length - 1
        ? "after:content-['|'] after:text-[#FF6A00] after:ml-4 after:mr-1"
        : ""
    }
  `}
                >
                  {item.label?.toUpperCase() || ""}
                  {isDropdownMenu && (
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`w-3 h-3 transition duration-200 group-hover:rotate-180`}
                    />
                  )}
                </Link>

                {/* MEGA MENU ONLY FOR HIGHLIGHTS */}
                {isDropdownMenu && (
                  <div
                    className="
    absolute left-3/4 top-full
    -translate-x-1/2
    bg-white
    shadow-[0_8px_20px_rgba(0,0,0,0.08)]
    border-t border-slate-200
    py-8 px-8
    z-50
    transition-all duration-200
    w-[min(100vw-40px,1000px)]
    mt-4
    opacity-0 invisible
    group-hover:opacity-100 group-hover:visible group-hover:mt-2
  "
                  >
                    <div className="grid grid-cols-3 gap-10">
                      {categoryColumns.map((column, colIndex) => (
                        <div key={colIndex}>
                          {/* <h3 className="text-gray-900 font-semibold mb-4 text-sm tracking-wide">
                            Categories
                          </h3> */}

                          <ul className="space-y-2">
                            {column.map((cat) => {
                              // console.log("-=-=- map -=--=-=", cat);
                              return (
                                <li key={cat._id}>
                                  <Link
                                    href={`/category/${cat.code}`}
                                    className="text-gray-600 hover:text-[#FF6A00] text-[13px] block"
                                  >
                                    {cat.displayName}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* SEARCH */}
        <div className="ml-auto flex border rounded overflow-hidden bg-[#eaeff2]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex border rounded overflow-hidden bg-[#eaeff2]"
          >
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search..."
              className="px-3 text-slate-900 py-2 text-sm flex-1 outline-none"
            />
            <button type="submit" className="px-3">
              <img src="/img/circle.png" className="w-5" alt="Search" />
            </button>
          </form>
        </div>

        {/* BASKET */}
        <div
          onClick={() => router.push("/cart")}
          className="relative flex flex-col items-center gap-1 cursor-pointer text-sm text-slate-700 hover:text-[#FF6A00] transition"
        >
          <FontAwesomeIcon icon={faCartShopping} className="text-lg" />
          {!loading && items.length > 0 && (
            <span className="absolute -top-2 -right-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[11px] font-semibold text-white bg-[#FF6A00] rounded-full">
              {items.reduce((total, item) => total + item.quantity, 0)}
            </span>
          )}
          <span className="font-medium">Basket</span>
        </div>
      </div>

      {/* DELIVERY INFO */}
      <div className="bg-[#e9e7e2] text-black text-xs sm:text-sm p-1 text-center">
        {deliveryText}
      </div>
    </header>
  );
}
