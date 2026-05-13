export const QuoteConfig = {
  key: "quote",
  name: "Quote",
  schema: [
    { field: "quote", label: "Quote", type: "textarea" },
    { field: "author", label: "Author", type: "text" },
  ],
};

export default function QuoteBlock({ quote, author }) {
  return (
    <section className="my-12 text-center">
      <blockquote className="text-xl italic">{`"${quote}"`}</blockquote>
      <p className="text-gray-500 mt-2">— {author}</p>
    </section>
  );
}
