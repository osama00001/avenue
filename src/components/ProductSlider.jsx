"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import ProductCard from "@/components/ProductCard";

export default function ProductSlider({
  products,
  title,
  seeMoreUrl,
  limit = 10,
  slidesPerView = 5,
  autoplay = true,
  autoplayDelay = 3000,
  transitionSpeed = 600,
  showArrows = true,
  showDots = true,
  loop = true,
}) {
  const items = (products || []).slice(0, limit);

  // Swiper loop requires at least (slidesPerView * 2) slides; disable it
  // when we don't have enough to prevent the console warning.
  const canLoop = loop && items.length >= slidesPerView * 2;

  // Don't render an empty section at all — avoids blank gaps on homepage
  if (items.length === 0) return null;

  return (
    <section className="px-6 mt-10 md:mt-15 mb-10 md:mb-15 pb-10 border-b page-width">
      {/* Header */}
      {(title || seeMoreUrl) && (
        <div className="flex text-black justify-between items-center mb-6">
          {title && <h2 className="text-2xl italic">{title}</h2>}

          {seeMoreUrl && (
            <a href={seeMoreUrl} className="text-[#FF6A00] font-semibold hover:underline">
              SEE MORE
            </a>
          )}
        </div>
      )}

      <div className="relative">
        <Swiper
          modules={[Autoplay, Navigation, Pagination]}
          speed={transitionSpeed}
          autoplay={
            autoplay
              ? {
                delay: autoplayDelay,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }
              : false
          }
          navigation={showArrows}
          pagination={showDots ? { clickable: true } : false}
          loop={canLoop}
          spaceBetween={24}
          breakpoints={{
            0: { slidesPerView: 2 },
            640: { slidesPerView: Math.min(slidesPerView, 3) },
            1024: { slidesPerView },
          }}
        >
          {items.map((product) => (
            <SwiperSlide key={product._id}>
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
