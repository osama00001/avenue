export const ImageTextConfig = {
  key: "imageText",
  name: "Image + Text",
  schema: [
    { field: "title", label: "Title", type: "text" },
    { field: "subtitle", label: "Subheading", type: "text" },

    { field: "image", label: "Image URL", type: "image" },

    { field: "layout", label: "Layout (left/right)", type: "text" },

    { field: "width", label: "Width(px)", type: "text" },
    { field: "height", label: "Height(px)", type: "text" },

    { field: "text", label: "Body Text", type: "textarea" },
  ],
};

export default function ImageText({
  title,
  subtitle,
  image,
  layout,
  width,
  height,
  text,
}) {
  const isRight = layout === "right";

  const Image = image && (
    <img
      src={image}
      style={{
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "auto",
      }}
      className="rounded-lg object-cover"
    />
  );

  const TextContent = (
    <div className="flex flex-col justify-center space-y-3">
      {title && <h2 className="text-2xl font-bold">{title}</h2>}

      {subtitle && <h4 className="text-gray-500">{subtitle}</h4>}

      {text && <p className="leading-relaxed">{text}</p>}
    </div>
  );

  return (
    <section className="grid md:grid-cols-2 gap-8 my-12 items-center">
      {!isRight && Image}
      {TextContent}
      {isRight && Image}
    </section>
  );
}
