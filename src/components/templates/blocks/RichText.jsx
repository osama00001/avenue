export const RichTextConfig = {
  key: "richText",
  name: "Rich Text",
  schema: [
    { field: "content", label: "Content", type: "richtext" },
  ],
};

export default function RichText({ content }) {
  return (
    <div
      className="prose max-w-none my-8"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
