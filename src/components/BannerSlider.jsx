"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export default function BannerSlider({
  slides,
  autoSlide = true,
  interval = 5000,
  showDots = true,
  showArrows = true,
}) {
  const [current, setCurrent] = useState(0);
  const slideCount = slides.length;
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!autoSlide || slideCount === 0) return;

    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev === slideCount - 1 ? 0 : prev + 1));
    }, interval);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [current, slideCount, autoSlide, interval]);

  const goToSlide = (index) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCurrent(index);
  };

  if (slideCount === 0) return null;

  return (
    <div className="relative w-full mx-auto overflow-hidden">
      {/* Slides */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map(({ id, imageUrl, alt, href }) => (
          <Link
            key={id}
            href={href}
            className="min-w-full block relative"
            aria-label={alt}
          >
            <Image
              src={imageUrl}
              alt={alt}
              width={1200}
              height={400}
              className="object-cover w-full h-64 md:h-96"
              priority={id === 0}
            />
          </Link>
        ))}
      </div>

      {/* Navigation dots */}
      {showDots && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                current === index ? "bg-white" : "bg-gray-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}

      {/* Prev/Next arrows */}
      {showArrows && (
        <>
          <button
            aria-label="Previous Slide"
            onClick={() => goToSlide(current === 0 ? slideCount - 1 : current - 1)}
            className="absolute top-1/2 left-4 -translate-y-1/2 bg-black bg-opacity-40 text-white rounded-full p-2 hover:bg-opacity-60"
          >
            ‹
          </button>

          <button
            aria-label="Next Slide"
            onClick={() => goToSlide(current === slideCount - 1 ? 0 : current + 1)}
            className="absolute top-1/2 right-4 -translate-y-1/2 bg-black bg-opacity-40 text-white rounded-full p-2 hover:bg-opacity-60"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
