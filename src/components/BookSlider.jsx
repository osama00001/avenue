"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import Link from "next/link";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function BookSlider({ slides, slidespace, slidesitem }) {
  return (
    <div className="page-width">
      <Swiper
        modules={[Navigation, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        loop
        spaceBetween={slidespace}
        slidesPerView={slidesitem}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="relative flex">
              <Link href={slide.link}>
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-contain"
                />
              </Link>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
