import Link from "next/link";
import Image from "next/image";
import { shouldUseNativeImage } from "@/lib/mediaUrl";

export default function SaleHighlights({ highlights, saletitle, variant = "links" }) {
  if (!highlights?.length) return null;

  const imageClass =
    variant === "icons"
      ? "h-24 w-24 shrink-0 object-contain"
      : "shrink-0 object-contain";

  return (
    <section className="py-10 px-4 max-w-6xl mx-auto text-center">
      {saletitle ? (
        <h2 className="mb-8 italic text-black text-lg font-light">{saletitle}</h2>
      ) : null}

      <div className="flex justify-center gap-10 flex-wrap">
        {highlights.map(({ id, label, iconSrc, href }) => {
          const inner = (
            <>
              <div className="flex items-center justify-center">
                {shouldUseNativeImage(iconSrc) ? (
                  <img
                    src={iconSrc}
                    alt=""
                    className={imageClass}
                    loading="lazy"
                  />
                ) : (
                  <Image
                    src={iconSrc}
                    alt=""
                    width={variant === "icons" ? 96 : 140}
                    height={variant === "icons" ? 96 : 140}
                    className={imageClass}
                  />
                )}
              </div>
              <span className="text-sm font-medium">{label}</span>
            </>
          );

          if (!href) {
            return (
              <div
                key={id}
                className="flex flex-col items-center space-y-3 text-black"
              >
                {inner}
              </div>
            );
          }

          return (
            <Link
              key={id}
              href={href}
              className="flex flex-col items-center space-y-3 text-black no-underline hover:text-red-800 transition"
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
