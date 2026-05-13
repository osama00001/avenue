import Link from "next/link";
import Image from "next/image";

export default function SaleHighlights({ highlights, saletitle }) {
  return (
    <section className="py-10 px-4 max-w-6xl mx-auto text-center">
      <h2 className="mb-8 italic text-black text-lg font-light">{saletitle}</h2>

      <div className="flex justify-center gap-10 flex-wrap">
        {highlights.map(({ id, label, iconSrc, href }) => (
          <Link
            key={id}
            href={href}
            className="flex flex-col items-center space-y-3 text-black no-underline hover:text-red-800 transition"
          >
            <div className="flex items-center justify-center">
              <Image
                src={iconSrc}
                alt={label}
                width={1000}
                height={1000}
                className="object-cover h-full w-full"
              />
            </div>
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
