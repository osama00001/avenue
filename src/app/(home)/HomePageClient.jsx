"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import BannerSlider from "@/components/BannerSlider";
import SaleHighlights from "@/components/SaleHighlights";
import ProductSlider from "@/components/ProductSlider";
import Link from "next/link";
import BlogSection from "@/components/BlogSection";
import { useDispatch, useSelector } from "react-redux";
import { fetchBooksForHome } from "@/store/bookSlice";
import reverseName from "@/lib/reverseName";
import { fetchUserDetails } from "@/store/userSlice";
import { fetchCart } from "@/store/cartSlice";
import { fetchCategories } from "@/store/categorySlice";
import { fetchBlogCategories, fetchBlogs } from "@/store/blogSlice";
import { useSession } from "next-auth/react";
import { getStrapiMediaUrl } from "@/lib/strapi";

export default function HomePage() {
  const {
    loading,
    error,
    books,
    catalog,
    bestsellers,
    popular,
    new_books,
    highlights: highlightsBooks,
    special_editions,
    coming_soon,
    fiction,
    non_fiction,
    recently_reviewed,
    paperback_books,
    children_books,
    language,
    games,
    adult_books,
    gift_books,
  } = useSelector((state) => state.book);

  const { user } = useSelector((state) => state.user);
  const { list: blogList, categories: blogCategories, loading: blogLoading, categoryLoading } = useSelector(
    (s) => s.blog
  );

  const dispatch = useDispatch();

  const [row1, setRow1] = useState([]);
  const [row2, setRow2] = useState([]);
  const [row3, setRow3] = useState([]);
  const [row4, setRow4] = useState([]);
  const [row5, setRow5] = useState([]);
  const [row6, setRow6] = useState([]);
  const [row7, setRow7] = useState([]);
  const [row8, setRow8] = useState([]);
  const [row9, setRow9] = useState([]);
  const [row10, setRow10] = useState([]);
  const [row11, setRow11] = useState([]);
  const [row12, setRow12] = useState([]);
  const [row13, setRow13] = useState([]);
  const [row14, setRow14] = useState([]);
  const [bannerSlides, setBannerSlides] = useState([]);
  const [promoSlides, setPromoSlides] = useState([]);
  const [stripBanner, setStripBanner] = useState(null);
  const [bottomBanner, setBottomBanner] = useState(null);
  const [middleBanner, setMiddleBanner] = useState(null);
  const [mainBanner, setMainBanner] = useState(null);
  const [quickLinks, setQuickLinks] = useState([]);
  const [strapiPending, setStrapiPending] = useState(6);


  const { status: sessionStatus } = useSession();

  useEffect(() => {
    dispatch(
      fetchBooksForHome({ category: "bestsellers", limit: 10, page: 1 })
    );
    dispatch(fetchCart());
    dispatch(fetchBooksForHome({ category: "popular", limit: 10, page: 2 }));
    dispatch(
      fetchBooksForHome({ category: "new_books", limit: 10, page: 3 })
    );
    dispatch(
      fetchBooksForHome({ category: "highlights", limit: 10, page: 4 })
    );
    dispatch(
      fetchBooksForHome({ category: "special_editions", limit: 10, page: 5 })
    );
    dispatch(
      fetchBooksForHome({ category: "coming_soon", limit: 10, page: 6 })
    );
    dispatch(fetchBooksForHome({ category: "fiction", limit: 10, page: 7 }));
    dispatch(
      fetchBooksForHome({ category: "non_fiction", limit: 10, page: 8 })
    );
    dispatch(
      fetchBooksForHome({ category: "recently_reviewed", limit: 10, page: 9 })
    );
    dispatch(
      fetchBooksForHome({ category: "paperback_books", limit: 10, page: 10 })
    );
    dispatch(
      fetchBooksForHome({ category: "children_books", limit: 10, page: 11 })
    );
    dispatch(
      fetchBooksForHome({ category: "language", limit: 10, page: 12 })
    );
    dispatch(
      fetchBooksForHome({ category: "games", limit: 10, page: 13 })
    );
    dispatch(
      fetchBooksForHome({ category: "adult_books", limit: 10, page: 14 })
    );
    dispatch(
      fetchBooksForHome({ category: "gift_books", limit: 10, page: 15 })
    );
    dispatch(fetchCategories({ page: 1, limit: 50 }));
    dispatch(fetchBlogs());
    dispatch(fetchBlogCategories());
  }, []);

  useEffect(() => {
    const loadBannerSlides = async () => {
      try {
        const res = await fetch("/api/strapi/home-banner");
        if (!res.ok) return;
        const payload = await res.json();
        const entry = payload?.data;
        const attributes = entry?.attributes ?? entry;
        const slides = attributes?.slides || [];

        const resolved = slides
          .map((slide, index) => {
            const image =
              slide.imageUrl ||
              slide.image?.url ||
              slide.image?.data?.attributes?.url ||
              slide.image?.data?.url;
            const imageUrl = getStrapiMediaUrl(image);
            if (!imageUrl) return null;
            return {
              id: slide.id ?? index,
              imageUrl,
              alt: slide.alt || slide.title || "Banner",
              href: slide.href || "/",
              order: slide.order ?? index,
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.order - b.order);

        if (resolved.length) {
          setBannerSlides(resolved);
        }
      } catch (err) {
        console.error("[home] failed to load banner slides", err);
      } finally {
        setStrapiPending((prev) => Math.max(prev - 1, 0));
      }
    };

    loadBannerSlides();
  }, []);

  useEffect(() => {
    const loadPromoSlides = async () => {
      try {
        const res = await fetch("/api/strapi/home-promo");
        if (!res.ok) return;
        const payload = await res.json();
        const entry = payload?.data;
        const attributes = entry?.attributes ?? entry;
        const slides = attributes?.slides || [];
        const resolved = slides
          .map((slide, index) => {
            const image =
              slide.imageUrl ||
              slide.image?.url ||
              slide.image?.data?.attributes?.url ||
              slide.image?.data?.url;
            const imageUrl = getStrapiMediaUrl(image);
            if (!imageUrl) return null;
            return {
              id: slide.id ?? index,
              title: slide.title || "Promo",
              link: slide.href || "/",
              image: imageUrl,
              order: slide.order ?? index,
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.order - b.order);

        if (resolved.length) {
          setPromoSlides(resolved);
        }
      } catch (err) {
        console.error("[home] failed to load promo slides", err);
      } finally {
        setStrapiPending((prev) => Math.max(prev - 1, 0));
      }
    };

    loadPromoSlides();
  }, []);

  useEffect(() => {
    const loadStripBanner = async () => {
      try {
        const res = await fetch("/api/strapi/home-strip");
        if (!res.ok) return;
        const payload = await res.json();
        const entry = payload?.data;
        if (entry?.imageUrl) {
          setStripBanner(entry);
        }
      } catch (err) {
        console.error("[home] failed to load strip banner", err);
      } finally {
        setStrapiPending((prev) => Math.max(prev - 1, 0));
      }
    };

    loadStripBanner();
  }, []);

  useEffect(() => {
    const loadBottomBanner = async () => {
      try {
        const res = await fetch("/api/strapi/home-bottom-banner");
        if (!res.ok) return;
        const payload = await res.json();
        const entry = payload?.data;
        if (entry?.imageUrl) {
          setBottomBanner(entry);
        }
      } catch (err) {
        console.error("[home] failed to load bottom banner", err);
      } finally {
        setStrapiPending((prev) => Math.max(prev - 1, 0));
      }
    };

    loadBottomBanner();
  }, []);

  useEffect(() => {
    const loadMiddleBanner = async () => {
      try {
        const res = await fetch("/api/strapi/home-middle-banner");
        if (!res.ok) return;
        const payload = await res.json();
        console.warn(payload, "payload")
        const entry = payload?.data;
        if (entry?.imageUrl) {
          setMiddleBanner(entry);
        }
      } catch (err) {
        console.error("[home] failed to load middle banner", err);
      } finally {
        setStrapiPending((prev) => Math.max(prev - 1, 0));
      }
    };

    loadMiddleBanner();
  }, []);

  useEffect(() => {
    const loadMainBanner = async () => {
      try {
        const res = await fetch("/api/strapi/home-main-banner");
        if (!res.ok) return;
        const payload = await res.json();
        const entry = payload?.data;
        if (entry?.imageUrl) {
          setMainBanner(entry);
        }
      } catch (err) {
        console.error("[home] failed to load main banner", err);
      } finally {
        setStrapiPending((prev) => Math.max(prev - 1, 0));
      }
    };

    loadMainBanner();
  }, []);

  useEffect(() => {
    const loadQuickLinks = async () => {
      try {
        const res = await fetch("/api/strapi/home-quick-links");
        if (!res.ok) return;
        const payload = await res.json();
        const entry = payload?.data;
        const attributes = entry?.attributes ?? entry;
        const items = (attributes?.items || [])
          .map((item, index) => {
            const image =
              item.imageUrl ||
              item.image?.url ||
              item.image?.data?.attributes?.url ||
              item.image?.data?.url;
            const imageUrl = getStrapiMediaUrl(image);
            if (!imageUrl) return null;
            return {
              id: item.id ?? index,
              label: item.label,
              iconSrc: imageUrl,
              href: item.href || "/",
              order: item.order ?? index,
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.order - b.order);

        if (items.length) {
          setQuickLinks(items);
        }
      } catch (err) {
        console.error("[home] failed to load quick links", err);
      }
    };

    loadQuickLinks();
  }, []);

  // Only fetch user when a session is confirmed Ã¢â‚¬â€ avoids 401 noise for guests
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      dispatch(fetchUserDetails());
    }
  }, [sessionStatus, dispatch]);

  //   useEffect(() => {
  //   dispatch(fetchCategories({ page: 1, limit: 50 }));
  // }, [dispatch]);

  // console.log("User Data on Home Page:", user);

  // Stable per-book placeholder: XOR-fold the full _id string so every
  // character contributes â†’ even distribution across all 82 placeholder images.
  const placeholderIdx = (id = "") => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h ^ id.charCodeAt(i)) & 0xff;
    return (h % 82) + 1;
  };

  useEffect(() => {
    if (bestsellers) {
      const row = bestsellers.map((item, index) => ({
        ...item,
        author: reverseName(
          item.descriptiveDetail?.contributors?.find(c => c.role === "A01")?.nameInverted
          || item.descriptiveDetail?.contributors?.[0]?.nameInverted
          || ""
        ),
        image: item.coverImage || `/covers/${item.recordReference.split("_")[0] || ""}.jpg`,
        format: "Paperback",
        preorder: false,
      }));
      setRow1(row);
    }
    if (popular) {
      const row = popular.map((item, index) => ({
        ...item,
        author: reverseName(
          item.descriptiveDetail?.contributors?.find(c => c.role === "A01")?.nameInverted
          || item.descriptiveDetail?.contributors?.[0]?.nameInverted
          || ""
        ),
        image: item.coverImage || `/covers/${item.recordReference.split("_")[0] || ""}.jpg`,
        format: "Paperback",
        preorder: false,
      }));
      setRow2(row);
    }
    if (new_books) {
      const row = new_books.map((item, index) => ({
        ...item,
        author: reverseName(
          item.descriptiveDetail?.contributors?.find(c => c.role === "A01")?.nameInverted
          || item.descriptiveDetail?.contributors?.[0]?.nameInverted
          || ""
        ),
        image: item.coverImage || `/covers/${item.recordReference.split("_")[0] || ""}.jpg`,
        format: "Paperback",
        preorder: false,
      }));
      setRow3(row);
    }
    if (highlightsBooks) {
      const row = highlightsBooks.map((item, index) => ({
        ...item,
        author: reverseName(
          item.descriptiveDetail?.contributors?.find(c => c.role === "A01")?.nameInverted
          || item.descriptiveDetail?.contributors?.[0]?.nameInverted
          || ""
        ),
        image: item.coverImage || `/covers/${item.recordReference.split("_")[0] || ""}.jpg`,
        format: "Paperback",
        preorder: false,
      }));
      setRow4(row);
    }
    if (special_editions) {
      const row = special_editions.map((item, index) => ({
        ...item,
        author: reverseName(
          item.descriptiveDetail?.contributors?.find(c => c.role === "A01")?.nameInverted
          || item.descriptiveDetail?.contributors?.[0]?.nameInverted
          || ""
        ),
        image: item.coverImage || `/covers/${item.recordReference.split("_")[0] || ""}.jpg`,
        format: "Paperback",
        preorder: false,
      }));
      setRow5(row);
    }
    if (coming_soon) {
      const row = coming_soon.map((item, index) => ({
        ...item,
        author: reverseName(
          item.descriptiveDetail?.contributors?.find(c => c.role === "A01")?.nameInverted
          || item.descriptiveDetail?.contributors?.[0]?.nameInverted
          || ""
        ),
        image: item.coverImage || `/covers/${item.recordReference.split("_")[0] || ""}.jpg`,
        format: "Paperback",
        preorder: true,
      }));
      setRow6(row);
    }
    if (fiction) {
      const row = fiction.map((item, index) => ({
        ...item,
        author: reverseName(
          item.descriptiveDetail?.contributors?.find(c => c.role === "A01")?.nameInverted
          || item.descriptiveDetail?.contributors?.[0]?.nameInverted
          || ""
        ),
        image: item.coverImage || `/covers/${item.recordReference.split("_")[0] || ""}.jpg`,
        format: "Paperback",
        preorder: false,
      }));
      setRow7(row);
    }
    if (non_fiction) {
      const row = non_fiction.map((item, index) => ({
        ...item,
        author: reverseName(
          item.descriptiveDetail?.contributors?.find(c => c.role === "A01")?.nameInverted
          || item.descriptiveDetail?.contributors?.[0]?.nameInverted
          || ""
        ),
        image: item.coverImage || `/covers/${item.recordReference.split("_")[0] || ""}.jpg`,
        format: "Paperback",
        preorder: false,
      }));
      setRow8(row);
    }
    if (recently_reviewed) {
      const row = recently_reviewed.map((item, index) => ({
        ...item,
        author: reverseName(
          item.descriptiveDetail?.contributors?.find(c => c.role === "A01")?.nameInverted
          || item.descriptiveDetail?.contributors?.[0]?.nameInverted
          || ""
        ),
        image: item.coverImage || `/covers/${item.recordReference.split("_")[0] || ""}.jpg`,
        format: "Paperback",
        preorder: false,
      }));
      setRow9(row);
    }
    if (paperback_books) {
      const row = paperback_books.map((item, index) => ({
        ...item,
        author: reverseName(
          item.descriptiveDetail?.contributors?.find(c => c.role === "A01")?.nameInverted
          || item.descriptiveDetail?.contributors?.[0]?.nameInverted
          || ""
        ),
        image: item.coverImage || `/covers/${item.recordReference.split("_")[0]|| ""}.jpg`,
        format: "Paperback",
        preorder: false,
      }));
      setRow10(row);
    }
    if (children_books) {
      const row = children_books.map((item, index) => ({
        ...item,
        author: reverseName(
          item.descriptiveDetail?.contributors?.find(c => c.role === "A01")?.nameInverted
          || item.descriptiveDetail?.contributors?.[0]?.nameInverted
          || ""
        ),
        image: item.coverImage || `/covers/${item.recordReference.split("_")[0] || ""}.jpg`,
        format: "Paperback",
        preorder: false,
      }));
      setRow11(row);
    }
    if (language) {
      const row = language.map((item, index) => ({
        ...item,
        author: reverseName(
          item.descriptiveDetail?.contributors?.find(c => c.role === "A01")?.nameInverted
          || item.descriptiveDetail?.contributors?.[0]?.nameInverted
          || ""
        ),
        image: item.coverImage || `/covers/${item.recordReference.split("_")[0] || ""}.jpg`,
        format: "Paperback",
        preorder: false,
      }));
      setRow12(row);
    }
    if (games) {
      const row = games.map((item, index) => ({
        ...item,
        author: reverseName(
          item.descriptiveDetail?.contributors?.find(c => c.role === "A01")?.nameInverted
          || item.descriptiveDetail?.contributors?.[0]?.nameInverted
          || ""
        ),
        image: item.coverImage || `/covers/${item.recordReference.split("_")[0] || ""}.jpg`,
        format: "Paperback",
        preorder: false,
      }));
      setRow13(row);
    }
    if (adult_books) {
      const row = adult_books.map((item, index) => ({
        ...item,
        author: reverseName(
          item.descriptiveDetail?.contributors?.find(c => c.role === "A01")?.nameInverted
          || item.descriptiveDetail?.contributors?.[0]?.nameInverted
          || ""
        ),
        image: item.coverImage || `/covers/${item.recordReference.split("_")[0] || ""}.jpg`,
        format: "Paperback",
        preorder: false,
      }));
      setRow14(row);
    }
  }, [
    books,
    bestsellers,
    popular,
    new_books,
    highlightsBooks,
    special_editions,
    coming_soon,
    fiction,
    non_fiction,
    recently_reviewed,
    paperback_books,
    children_books,
    language,
    games,
    adult_books,
    gift_books,
  ]);

  const highlights = [
    {
      id: 1,
      label: "Bestsellers",
      iconSrc: "/img/icons/bestseller1.webp",
      href: "/bestsellers",
    },
    {
      id: 2,
      label: "Fiction",
      iconSrc: "/img/icons/fictionreb1.webp",
      href: "/fiction",
    },
    {
      id: 3,
      label: "Non-Fiction",
      iconSrc: "/img/icons/non-fiction1.webp",
      href: "/non-fiction",
    },
    {
      id: 4,
      label: "Children's",
      iconSrc: "/img/icons/childrens1.webp",
      href: "/childrens",
    },
    {
      id: 5,
      label: "Stationery",
      iconSrc: "/img/icons/stationary1.webp",
      href: "/stationery",
    },
    {
      id: 6,
      label: "Calendars & Diaries",
      iconSrc: "/img/icons/calenderdiary1.webp",
      href: "/calendars-diaries",
    },
  ];

  const highlights2 = [
    {
      id: 1,
      label: "Bestsellers",
      iconSrc: "/img/icons/sale_highlight.webp",
      href: "/bestsellers",
    },
    {
      id: 2,
      label: "Fiction",
      iconSrc: "/img/icons/sale-hight-3.webp",
      href: "/fiction",
    },
    {
      id: 3,
      label: "Non-Fiction",
      iconSrc: "/img/icons/sale-higl-4.webp",
      href: "/non-fiction",
    },
    {
      id: 4,
      label: "Children's",
      iconSrc: "/img/icons/salehight-2.webp",
      href: "/childrens",
    },
  ];
  const highlights2Resolved = quickLinks.length ? quickLinks : highlights2;

  const products = [
    {
      id: "1",
      slug: "let-them-theory",
      title: "The Let Them Theory",
      author: "Mel Robbins",
      image: "/img/whenthecreanes.webp",
      price: 18.99,
      originalPrice: 22.99,
      format: "Paperback",
      preorder: true,
    },
    {
      id: "2",
      slug: "hamnet",
      title: "Hamnet",
      author: "Maggie O'Farrell",
      image: "/img/housemaidbook.jpg",
      price: 8.99,
      originalPrice: 10.99,
      format: "Paperback",
      preorder: false,
    },
    {
      id: "3",
      slug: "hamnet",
      title: "Hamnet",
      author: "Maggie O'Farrell",
      image: "/img/whenthecreanes.webp",
      price: 8.99,
      originalPrice: 10.99,
      format: "Paperback",
      preorder: false,
    },
    {
      id: "4",
      slug: "hamnet",
      title: "Hamnet",
      author: "Maggie O'Farrell",
      image: "/img/whenthecreanes.webp",
      price: 8.99,
      originalPrice: 10.99,
      format: "Paperback",
      preorder: false,
    },
    {
      id: "5",
      slug: "hamnet",
      title: "Hamnet",
      author: "Maggie O'Farrell",
      image: "/img/murderatmountfuji.jpg",
      price: 8.99,
      originalPrice: 10.99,
      format: "Paperback",
      preorder: false,
    },
    {
      id: "6",
      slug: "hamnet",
      title: "Hamnet",
      author: "Maggie O'Farrell",
      image: "/img/housemaidbook.jpg",
      price: 8.99,
      originalPrice: 10.99,
      format: "Paperback",
      preorder: false,
    },
    {
      id: "7",
      slug: "hamnet",
      title: "Hamnet",
      author: "Maggie O'Farrell",
      image: "/img/murderatmountfuji.jpg",
      price: 8.99,
      originalPrice: 10.99,
      format: "Paperback",
      preorder: false,
    },
    {
      id: "8",
      slug: "hamnet",
      title: "Hamnet",
      author: "Maggie O'Farrell",
      image: "/img/murderatmountfuji.jpg",
      price: 8.99,
      originalPrice: 10.99,
      format: "Paperback",
      preorder: false,
    },
  ];

  const products2 = [...products];

  const fallbackPromoSlides = [
    {
      title: "PROTEIN in 15",
      subtitle: "Protein packed meals from the Body Coach",
      link: "/",
      image: "/img/sprinkbanner/joewiocl.webp",
    },
    {
      title: "DONUT SQUAD",
      subtitle: "Another sprinkling of madness with the Donut Squad",
      link: "/",
      image: "/img/sprinkbanner/speinklink.webp",
    },
    {
      title: "NEW BOOKS!",
      subtitle: "The Biggest and Best Publishing Out Now",
      link: "/",
      image: "/img/sprinkbanner/newbboks.webp",
    },
    {
      title: "NEW BOOKS!",
      subtitle: "The Biggest and Best Publishing Out Now",
      link: "/",
      image: "/img/sprinkbanner/speinklink.webp",
    },
  ];
  const promoSlidesResolved = promoSlides.length
    ? promoSlides
    : fallbackPromoSlides;
  const promoBanner = promoSlidesResolved[0];

  const fallbackBanners = [
    {
      id: 1,
      imageUrl: "/banner/1.png",
      alt: "Winter Sale - Up to 50% off",
      href: "/",
    },
    {
      id: 2,
      imageUrl: "/banner/2.png",
      alt: "New Releases Available Now",
      href: "/",
    },
    {
      id: 3,
      imageUrl: "/banner/3.jpg",
      alt: "Join Avenue Plus for exclusive perks",
      href: "/",
    },
    {
      id: 4,
      imageUrl: "/banner/banner4.webp",
      alt: "Join Avenue Plus for exclusive perks",
      href: "/",
    },
    {
      id: 5,
      imageUrl: "/banner/banner5.webp",
      alt: "Join Avenue Plus for exclusive perks",
      href: "/",
    },
  ];
  const banners = bannerSlides.length ? bannerSlides : fallbackBanners;
  const strapiLoading = strapiPending > 0;

  if (strapiLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF6A00] border-t-transparent" />
        <p className="text-sm uppercase tracking-[0.3em] text-slate-600">
          Loading...
        </p>
      </div>
    );
  }
  return (
    <div className="bg-white">
      <BannerSlider
        slides={banners}
        showArrows={false}
        autoSlide
        interval={5000}
      />

      <SaleHighlights
        saletitle="Discover Our Sale Highlights"
        highlights={highlights}
      />

      <ProductSlider
        title="Our Bestsellers"
        seeMoreUrl="/"
        products={row1}
        slidesPerView={5}
        autoplayDelay={2500}
        showArrows
        showDots={false}
        loop
      />

      <div className="page-width">
        <Link
          href={promoBanner?.link || "/"}
          className="min-w-full block relative"
        >
          {promoBanner?.image &&
            (promoBanner.image.includes("localhost:1337") ||
              promoBanner.image.includes("127.0.0.1:1337")) ? (
            <img
              src={promoBanner.image}
              alt={promoBanner.title || "Promo"}
              className="object-cover w-full"
              loading="lazy"
            />
          ) : (
            <Image
              src={promoBanner?.image || "/img/sprinkbanner/joewiocl.webp"}
              alt={promoBanner?.title || "Promo"}
              width={1400}
              height={200}
              className="object-cover w-full"
            />
          )}
        </Link>
      </div>

      <ProductSlider
        title="Everyone's Talking About..."
        seeMoreUrl="/"
        products={row2}
        slidesPerView={5}
        autoplayDelay={2500}
        showArrows
        showDots={false}
        loop
      />

      <ProductSlider
        title="New Books"
        seeMoreUrl="/"
        products={row3}
        slidesPerView={5}
        autoplayDelay={2500}
        showArrows
        showDots={false}
        loop
      />

      <ProductSlider
        title="Highlights"
        seeMoreUrl="/"
        products={row4}
        slidesPerView={5}
        autoplayDelay={2500}
        showArrows
        showDots={false}
        loop
      />

      <ProductSlider
        title="Signed & Special Editions"
        seeMoreUrl="/"
        products={row5}
        slidesPerView={5}
        autoplayDelay={2500}
        showArrows
        showDots={false}
        loop
      />

      <ProductSlider
        title="Coming Soon - The Biggest Books Coming in 2026"
        seeMoreUrl="/"
        products={row6}
        slidesPerView={5}
        autoplayDelay={2500}
        showArrows
        showDots={false}
        loop
      />

      <div className="page-width">
        <Link
          href={stripBanner?.href || "/"}
          className="min-w-full block relative"
        >
          {stripBanner?.imageUrl &&
            (stripBanner.imageUrl.includes("localhost:1337") ||
              stripBanner.imageUrl.includes("127.0.0.1:1337")) ? (
            <img
              src={stripBanner.imageUrl}
              alt={stripBanner.alt || stripBanner.title || "Banner"}
              className="object-cover w-full"
              loading="lazy"
            />
          ) : (
            <Image
              src={stripBanner?.imageUrl || "/img/image_slider.webp"}
              alt={stripBanner?.alt || stripBanner?.title || "image_slider"}
              width={1400}
              height={200}
              className="object-cover w-full"
            />
          )}
        </Link>
      </div>

      <ProductSlider
        title="Our Best Fiction Books"
        seeMoreUrl="/"
        products={row7}
        slidesPerView={5}
        autoplayDelay={2500}
        showArrows
        showDots={false}
        loop
      />

      <ProductSlider
        title="Our Best Non-Fiction Books"
        seeMoreUrl="/"
        products={row8}
        slidesPerView={5}
        autoplayDelay={2500}
        showArrows
        showDots={false}
        loop
      />

      <div className="page-width">
        <Link
          href={mainBanner?.href || "/"}
          className="min-w-full block relative"
        >
          {mainBanner?.imageUrl &&
            (mainBanner.imageUrl.includes("localhost:1337") ||
              mainBanner.imageUrl.includes("127.0.0.1:1337")) ? (
            <img
              src={mainBanner.imageUrl}
              alt={mainBanner.alt || mainBanner.title || "Banner"}
              className="object-cover w-full"
              loading="lazy"
            />
          ) : (
            <Image
              src={mainBanner?.imageUrl || "/img/main_bannerbottom.jpeg"}
              alt={mainBanner?.alt || mainBanner?.title || "image_slider"}
              width={1400}
              height={200}
              className="object-cover w-full"
            />
          )}
        </Link>
      </div>

      <ProductSlider
        title="Recently Reviewed"
        seeMoreUrl="/"
        products={row9}
        slidesPerView={5}
        autoplayDelay={2500}
        showArrows
        showDots={false}
        loop
      />

      <ProductSlider
        title="Our Bestselling Paperbacks"
        seeMoreUrl="/"
        products={row10}
        slidesPerView={5}
        autoplayDelay={2500}
        showArrows
        showDots={false}
        loop
      />

      <SaleHighlights
        saletitle="You May Be Looking For..."
        highlights={highlights2Resolved}
      />

      <ProductSlider
        title="Our Best Children's Books"
        seeMoreUrl="/"
        products={row11}
        slidesPerView={5}
        autoplayDelay={2500}
        showArrows
        showDots={false}
        loop
      />

      <div className="page-width">
        <Link
          href={middleBanner?.href || "/"}
          className="min-w-full block relative"
        >
          {middleBanner?.imageUrl &&
            (middleBanner.imageUrl.includes("localhost:1337") ||
              middleBanner.imageUrl.includes("127.0.0.1:1337")) ? (
            <img
              src={middleBanner.imageUrl}
              alt={middleBanner.alt || middleBanner.title || "Banner"}
              className="object-cover w-full"
              loading="lazy"
            />
          ) : (
            <Image
              src={middleBanner?.imageUrl || "/img/bottom-2banner.jpeg"}
              alt={middleBanner?.alt || middleBanner?.title || "image_slider"}
              width={1400}
              height={200}
              className="object-cover w-full"
            />
          )}
        </Link>
      </div>

      <ProductSlider
        title="Language Learning"
        seeMoreUrl="/"
        products={row12}
        slidesPerView={5}
        autoplayDelay={2500}
        showArrows
        showDots={false}
        loop
      />

      <ProductSlider
        title="Games & Puzzles"
        seeMoreUrl="/"
        products={row13}
        slidesPerView={5}
        autoplayDelay={2500}
        showArrows
        showDots={false}
        loop
      />

      <ProductSlider
        title="Our Best Young Adult Books"
        seeMoreUrl="/"
        products={row14}
        slidesPerView={5}
        autoplayDelay={2500}
        showArrows
        showDots={false}
        loop
      />

      <div className="page-width">
        <Link
          href={bottomBanner?.href || "/"}
          className="min-w-full block relative"
        >
          {bottomBanner?.imageUrl &&
            (bottomBanner.imageUrl.includes("localhost:1337") ||
              bottomBanner.imageUrl.includes("127.0.0.1:1337")) ? (
            <img
              src={bottomBanner.imageUrl}
              alt={bottomBanner.alt || bottomBanner.title || "Banner"}
              className="object-cover w-full"
              loading="lazy"
            />
          ) : (
            <Image
              src={bottomBanner?.imageUrl || "/img/bottom-3banner.jpeg"}
              alt={bottomBanner?.alt || bottomBanner?.title || "image_slider"}
              width={1400}
              height={200}
              className="object-cover w-full"
            />
          )}
        </Link>
      </div>

      <BlogSection />
    </div>
  );
}

