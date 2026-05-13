export const CTAConfig = {
  key: "cta",
  name: "CTA",
  schema: [
    { field: "title", label: "CTA Title", type: "text" },
    { field: "buttonText", label: "Button Text", type: "text" },
    { field: "link", label: "Button Link", type: "text" },
  ],
};

export default function CTA({
  title,
  buttonText,
  link,
}) {
  return (
    <section className="bg-black text-white p-10 text-center rounded-xl my-12">
      <h2 className="text-2xl mb-4">{title}</h2>

      <a
        href={link}
        className="bg-white text-black px-6 py-2 rounded"
      >
        {buttonText}
      </a>
    </section>
  );
}
