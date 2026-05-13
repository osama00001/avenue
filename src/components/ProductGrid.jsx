import ProductCard from "@/components/ProductCard";

export default function ProductGrid({
  products,
  title,
  seeMoreUrl,
  variant = "grid",
}) {
  const isCarousel = variant === "carousel";

  return (
    <section className="px-6">
      {/* Header */}
      {title && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl italic">{title}</h2>

          {seeMoreUrl && (
            <a href={seeMoreUrl} className="text-[#FF6A00]  font-semibold">
              SEE MORE
            </a>
          )}
        </div>
      )}

      {/* Products */}
      <div
        className={
          isCarousel
            ? "flex gap-8 overflow-x-auto pb-4 snap-x snap-mandatory"
            : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8"
        }
      >
        {products.map((product) => (
          <div key={product.id} className={isCarousel ? "snap-start" : ""}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
