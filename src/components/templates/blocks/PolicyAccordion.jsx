"use client";

import { useState } from "react";

/**
 * ===============================
 * CONFIG (CMS Schema)
 * ===============================
 */
export const PolicyAccordionConfig = {
  key: "policyAccordion",
  name: "Policy Accordion",
  schema: [
    { field: "heading", label: "Section Heading", type: "text" },
    { field: "content", label: "Content", type: "richtext" },
  ],
};

/**
 * ===============================
 * COMPONENT
 * ===============================
 */
export default function PolicyAccordion({
  heading,
  content,
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border rounded-md mb-4 overflow-hidden">

      {/* Header */}
      <div
        onClick={() => setOpen(!open)}
        className="
          flex justify-between items-center
          bg-gray-50 px-4 py-3
          cursor-pointer select-none
        "
      >
        <div className="font-semibold italic">
          {heading}
        </div>

        <div className="text-xl font-bold">
          {open ? "−" : "+"}
        </div>
      </div>

      {/* Body */}
      {open && (
        <div
          className="px-4 py-4 text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}

    </div>
  );
}
