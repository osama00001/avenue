"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function RichTextInput({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],

    content: value || "",

    immediatelyRender: false,

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // TipTap loads async — safe guard
  if (!editor) return null;

  const btn = (active) =>
    `px-3 py-1 text-sm rounded border ${
      active ? "bg-black text-white" : "bg-white hover:bg-gray-100"
    }`;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 border-b bg-gray-50">
        <button
          className={btn(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </button>

        <button
          className={btn(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </button>

        <button
          className={btn(editor.isActive("heading", { level: 2 }))}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </button>

        <button
          className={btn(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </button>

        <button
          className={btn(false)}
          onClick={() => editor.chain().focus().undo().run()}
        >
          Undo
        </button>

        <button
          className={btn(false)}
          onClick={() => editor.chain().focus().redo().run()}
        >
          Redo
        </button>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="p-4 min-h-[160px] prose max-w-none"
      />
    </div>
  );
}
