export const BlogHeroConfig = {
  key: "blogHero",
  name: "Blog Hero",
  schema: [
    { field: "title", label: "Title", type: "text" },
    { field: "subtitle", label: "Subtitle", type: "text" },

    { field: "image", label: "Image URL", type: "image" },

    // ⭐ NEW POSITION FIELD
    {
      field: "position",
      label: "Image Position (top/bottom)",
      type: "text",
    },

    { field: "width", label: "Width(px)", type: "text" },
    { field: "height", label: "Height(px)", type: "text" },
  ],
};

export default function BlogHero({
  title,
  subtitle,
  image,
  position,
  width,
  height,
}) {
  const img = image && (
    <img
      src={image}
      style={{
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "auto",
      }}
      className="rounded-xl my-6"
    />
  );

  return (
    <section className="py-12">
      {/* Image TOP */}
      {position !== "bottom" && img}

      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="text-gray-500 mt-2">{subtitle}</p>

      {/* Image BOTTOM */}
      {position === "bottom" && img}
    </section>
  );
}
