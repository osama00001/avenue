"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
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
import { fetchWishlist } from "@/store/wishlistSlice";
import HeaderUser from "./cards/HeaderUser";
import { fetchUserCategories } from "@/store/userCategorySlice";
import { fetchNavigation } from "@/store/navigationSlice";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { catalogUrlFromPathOrLabel, categoryBrowseUrl } from "@/lib/catalogCategories";
import { filterUtilityMenu } from "@/lib/navigation";

const headerHeartIconClass =
  "w-5 h-5 transition-all duration-200 [filter:brightness(0)_saturate(100%)] group-hover:[filter:brightness(0)_saturate(100%)_invert(48%)_sepia(90%)_saturate(1800%)_hue-rotate(360deg)_brightness(100%)_contrast(101%)]";

export default function Header() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { items = [], loading } = useSelector((state) => state.cart);
  const { bookIds: wishlistIds = [], loading: wishlistLoading } = useSelector(
    (state) => state.wishlist
  );
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
    dispatch(fetchCart());
    dispatch(fetchWishlist());
  }, [dispatch]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/content/site-settings");
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
    { label: "Bestsellers", href: "/category/bestsellers" },
    { label: "New Books", href: "/category/popular" },
    { label: "Highlights", href: "/highlights", enableMegaMenu: true },
    { label: "Fiction", href: "/category/fiction" },
    { label: "Children's", href: "/category/children_books" },
    { label: "Language", href: "/category/adult_books" },
    { label: "Games", href: "/category/gift_books" },
    { label: "E-BOOK", href: "/category/ebooks" },
  ];

  const fallbackUtilityMenu = [];

  const mainMenu =
    navigation?.mainMenu && navigation.mainMenu.length
      ? navigation.mainMenu
      : fallbackMainMenu;
  const utilityMenu =
    navigation?.utilityMenu && navigation.utilityMenu.length
      ? navigation.utilityMenu
      : fallbackUtilityMenu;
  const filteredUtilityMenu = filterUtilityMenu(utilityMenu);
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

  const saleBarText = siteSettings?.saleBarText || "SALE";

  const isInvalidSaleLink = (value) => {
    const v = String(value || "").trim().toLowerCase();
    return !v || v === "#" || v === "/#" || v.startsWith("javascript:");
  };

  const resolveSaleBarHref = () => {
    const raw = (siteSettings?.saleBarLink || "").trim();

    if (!isInvalidSaleLink(raw)) {
      const resolved = catalogUrlFromPathOrLabel(raw, saleBarText);
      if (resolved && !isInvalidSaleLink(resolved)) return resolved;
      if (raw.startsWith("http") || raw.startsWith("/")) return raw;
    }

    return (
      catalogUrlFromPathOrLabel("", saleBarText) ||
      categoryBrowseUrl("bestsellers")
    );
  };

  const saleBarHref = resolveSaleBarHref();

  const handleSaleBarClick = (e) => {
    if (isInvalidSaleLink(saleBarHref)) {
      e.preventDefault();
      router.push(categoryBrowseUrl("bestsellers"));
    }
  };
  const deliveryText =
    siteSettings?.deliveryText ||
    "Free UK delivery on orders over £25, otherwise £2.99";
  const logoUrl =
    resolveMediaUrl(siteSettings?.logo?.data?.attributes?.url) ||
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

  const cartItemCount = items.reduce(
    (total, item) => total + (item.quantity || 0),
    0
  );
  const wishlistCount = wishlistIds.length;

  const resolveMenuHref = (item) =>
    catalogUrlFromPathOrLabel(item.href, item.label) || item.href || "#";

  return (
    <header className="w-full  flex flex-col bg-white">
      {/* SALE BAR */}
      <Link
        href={saleBarHref}
        onClick={handleSaleBarClick}
        className="relative z-[100] block w-full bg-[#FF6A00] flex items-center justify-center text-white text-center py-1 text-xs sm:text-sm font-semibold hover:bg-[#e85f00] transition cursor-pointer"
      >
        <span className="mr-2 sm:mr-4 text-xl sm:text-3xl font-cursive">
          {saleBarText}
        </span>
        <span className="underline text-[8px] sm:text-[10px]">SHOP NOW</span>
      </Link>

      {/* UTILITY BAR - HIDDEN ON MOBILE */}
      <div className="hidden lg:flex justify-end items-center px-4 lg:px-6 py-2 text-sm relative z-[60]">
        <div className="flex gap-3 lg:gap-4 text-gray-700 text-xs lg:text-sm">
          {/* ACCOUNT DROPDOWN */}
          <div
            className="relative z-[60]"
            onMouseEnter={() => setHoveredDropdown("account")}
            onMouseLeave={() => setHoveredDropdown(null)}
          >
            <button className="hover:text-[#FF6A00] border-r border-slate-300 pr-2 lg:pr-3 flex items-center gap-1 transition">
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
                className={`absolute top-full right-0 mt-0 w-48 bg-white border border-slate-200 rounded shadow-lg z-[60] transition-all duration-200 origin-top ${
                  hoveredDropdown === "account"
                    ? "opacity-100 visible scale-y-100"
                    : "opacity-0 invisible scale-y-95"
                }`}
              >
                <Link
                  href="/wishlist"
                  className="block px-4 py-3 hover:bg-[#FF6A00]/10 hover:text-[#FF6A00] border-b border-slate-100 text-gray-700 font-medium text-sm transition"
                >
                  My Wishlist
                </Link>
                <Link
                  href="/auth/user/login"
                  className="block px-4 py-3 hover:bg-[#FF6A00]/10 hover:text-[#FF6A00] border-b border-slate-100 text-gray-700 font-medium text-sm transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/user/register"
                  className="block px-4 py-3 hover:bg-[#FF6A00]/10 hover:text-[#FF6A00] text-gray-700 font-medium text-sm transition"
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
          <Link href="/wishlist" className="relative group">
            <img src="/img/heart.webp" className={headerHeartIconClass} alt="Wishlist" />
            {!wishlistLoading && wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center text-[10px] font-semibold text-white bg-[#FF6A00] rounded-full">
                {wishlistCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="relative text-[#FF6A00] cursor-pointer"
            aria-label="Basket"
          >
            <FontAwesomeIcon icon={faCartShopping} />
            {!loading && cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center text-[10px] font-semibold text-white bg-[#FF6A00] rounded-full">
                {cartItemCount}
              </span>
            )}
          </button>
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
            const href = resolveMenuHref(item);

            return (
              <div key={item.label}>
                {isDropdownMenu ? (
                  <button
                    type="button"
                    onClick={() => toggleMobileDropdown(dropdownKey)}
                    className="w-full text-left flex items-center justify-between py-2 px-3 rounded hover:bg-slate-100 text-black font-medium text-sm"
                  >
                    {item.label}
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`w-3 h-3 transition ${
                        mobileDropdownOpen === dropdownKey ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                ) : (
                  <Link
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-left flex items-center justify-between py-2 px-3 rounded hover:bg-slate-100 text-black font-medium text-sm"
                  >
                    {item.label}
                  </Link>
                )}

                {/* MOBILE SUBMENU */}
                {isDropdownMenu && mobileDropdownOpen === dropdownKey && (
                  <div className="pl-4 space-y-1">
                    <Link
                      href="/highlights/bestsellers"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 text-gray-600 text-xs hover:bg-slate-50 rounded"
                    >
                      Bestsellers
                    </Link>
                    <Link
                      href="/highlights/new-arrivals"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 text-gray-600 text-xs hover:bg-slate-50 rounded"
                    >
                      New Arrivals
                    </Link>
                    <Link
                      href="/highlights/editor-picks"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 text-gray-600 text-xs hover:bg-slate-50 rounded"
                    >
                      Editor&apos;s Picks
                    </Link>
                    {level1Categories.map((cat) => (
                      <Link
                        key={cat._id}
                        href={`/category/${cat.code}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2 px-3 text-gray-600 text-xs hover:bg-slate-50 rounded"
                      >
                        {cat.displayName}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {filteredUtilityMenu.length > 0 && (
            <div className="border-t border-slate-200 pt-4 mt-4 space-y-2">
              {filteredUtilityMenu.map((item) => (
                <Link
                  key={item.label}
                  href={item.href || "#"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 px-3 rounded hover:bg-slate-100 text-gray-700 text-xs"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {/* MOBILE AUTH BUTTONS */}
          <div className="border-t border-slate-200 pt-4 mt-4 space-y-2">
            <Link
              href="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full py-2 px-3 rounded border border-gray-200 text-black text-center font-medium text-sm hover:bg-slate-50 transition"
            >
              My Wishlist
            </Link>
            <Link
              href="/auth/user/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full py-2 px-3 rounded bg-black text-white text-center font-medium text-sm hover:bg-[#FF6A00] transition"
            >
              Sign In
            </Link>
            <Link
              href="/auth/user/register"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full py-2 px-3 rounded bg-black text-white text-center font-medium text-sm hover:bg-[#FF6A00] transition"
            >
              Register
            </Link>
          </div>
        </nav>
      )}

      {/* DESKTOP NAV + SEARCH */}
      <div className="hidden lg:flex lg:items-center lg:justify-center py-3 border-y border-slate-200 relative z-10 w-full px-3 xl:px-5 2xl:px-8">
        <div className="flex items-center gap-3 xl:gap-5 max-w-full min-w-0">
        {/* MENU — grouped with search so no empty gap in the middle */}
        <nav className="flex items-center gap-1.5 xl:gap-2.5 2xl:gap-3 uppercase font-medium text-[#000] shrink-0">
          {menuWithEbook.map((item, index) => {
            const isDropdownMenu = item.enableMegaMenu || item.label === "Highlights";
            const dropdownKey = item.label || "Highlights";

            return (
              <div
                key={item.label}
                className="relative group shrink-0"
              >
                {/* MAIN MENU BUTTON */}
                <Link
                  href={resolveMenuHref(item)}
                  className={`relative flex items-center gap-0.5 whitespace-nowrap transition text-black text-[11px] lg:text-[12px] xl:text-[13px] 2xl:text-[14px] hover:text-[#FF6A00] ${
                    index !== menuWithEbook.length - 1
                      ? "after:content-['|'] after:text-gray-300 after:ml-2 after:mr-0.5 xl:after:ml-3 xl:after:mr-1 2xl:after:ml-4 2xl:after:mr-1.5"
                      : ""
                  }`}
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

        <div className="flex items-center gap-2 xl:gap-3 shrink-0">
        {/* SEARCH */}
        <div className="w-36 xl:w-44 2xl:w-52 flex border rounded overflow-hidden bg-[#eaeff2]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex w-full border rounded overflow-hidden bg-[#eaeff2]"
          >
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search..."
              className="px-3 text-slate-900 py-2 text-sm flex-1 min-w-0 w-full outline-none bg-transparent"
            />
            <button type="submit" className="px-3 shrink-0">
              <img src="/img/circle.png" className="w-5" alt="Search" />
            </button>
          </form>
        </div>

        {/* WISHLIST */}
        <div
          onClick={() => router.push("/wishlist")}
          className="relative group flex flex-col items-center gap-0.5 cursor-pointer text-sm text-slate-700 hover:text-[#FF6A00] transition shrink-0 px-0.5"
        >
          <img src="/img/heart.webp" className={headerHeartIconClass} alt="Wishlist" />
          {!wishlistLoading && wishlistCount > 0 && (
            <span className="absolute -top-2 -right-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[11px] font-semibold text-white bg-[#FF6A00] rounded-full">
              {wishlistCount}
            </span>
          )}
          <span className="font-medium text-xs xl:text-sm hidden xl:block">Wishlist</span>
        </div>

        {/* BASKET */}
        <div
          onClick={() => router.push("/cart")}
          className="relative flex flex-col items-center gap-0.5 cursor-pointer text-sm text-slate-700 hover:text-[#FF6A00] transition shrink-0 px-0.5"
        >
          <FontAwesomeIcon icon={faCartShopping} className="text-lg" />
          {!loading && cartItemCount > 0 && (
            <span className="absolute -top-2 -right-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[11px] font-semibold text-white bg-[#FF6A00] rounded-full">
              {cartItemCount}
            </span>
          )}
          <span className="font-medium text-xs xl:text-sm hidden xl:block">Basket</span>
        </div>
        </div>
        </div>
      </div>

      {/* DELIVERY INFO */}
      <div className="bg-[#e9e7e2] text-black text-xs sm:text-sm p-1 text-center">
        {deliveryText}
      </div>
    </header>
  );
}
