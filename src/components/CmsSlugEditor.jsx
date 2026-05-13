"use client";

import { useEffect, useState } from "react";
import { TEMPLATE_REGISTRY } from "./templates/registry";
import RichTextInput from "./templates/blocks/RichTextInput";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchCMSDetails } from "@/store/cmsSlice";

/**
 * =========================
 * SLUGIFY
 * =========================
 */
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function CmsSlugEditor({ slug }) {
  const router = useRouter();
  const dispatch = useDispatch();

  /**
   * ================= REDUX STATE =================
   */
  const cmsData = useSelector((s) => s.cms.selected);
  const reduxLoading = useSelector((s) => s.cms.loading);

  // console.log("-=-=-=- cmsData -=-=-=--= ", cmsData);

  /**
   * ================= LOCAL STATE =================
   */
  const [title, setTitle] = useState("");
  const [slugInput, setSlugInput] = useState(slug !== "new" ? slug : "");
  const [level, setLevel] = useState(0);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const [blocks, setBlocks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  /**
   * ================= LOAD FROM REDUX =================
   */
  useEffect(() => {
    if (slug && slug !== "new") {
      dispatch(fetchCMSDetails(slug));
    }
  }, [slug, dispatch]);

  /**
   * ================= HYDRATE LOCAL STATE =================
   */
  useEffect(() => {
    if (!cmsData) return;

    setTitle(cmsData.title || "");
    setSlugInput(cmsData.slug || slug);
    setLevel(cmsData.level ?? 0);

    const hydrated = (cmsData.blocks || []).map((b) => ({
      id: crypto.randomUUID(),
      ...b,
    }));

    setBlocks(hydrated);
  }, [cmsData]);

  /**
   * ================= SAVE =================
   */
  const savePage = async () => {
    setSaving(true);
    setStatus("");

    const payload = {
      slug: slugInput,
      _id: cmsData ? cmsData._id : "",
      title,
      level,
      blocks: blocks.map(({ type, data }) => ({
        type,
        data,
      })),
    };

    await fetch("/api/admin/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    setStatus("Saved ✓");

    router.back();
  };

  /**
   * ================= BLOCK EDIT =================
   */
  const addBlock = (key) => {
    setBlocks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: key, data: {} },
    ]);
  };

  const removeBlock = (id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const updateField = (id, field, value) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, data: { ...b.data, [field]: value } } : b
      )
    );
  };

  /**
   * ================= LOADING =================
   */
  if (reduxLoading && slug !== "new") {
    return (
      <div className="flex justify-center p-20 text-gray-500">
        Loading CMS Editor...
      </div>
    );
  }

  /**
   * ================= UI =================
   */
  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-24">
      {/* SAVE BAR */}
      <div className="sticky top-10 z-20 bg-white border rounded-xl mt-5 p-4 flex justify-between items-center shadow-sm">
        <div className="font-semibold text-lg">Editing: {slugInput}</div>

        <div className="flex items-center gap-4">
          {status && <div className="text-green-600 text-sm">{status}</div>}

          <button
            onClick={savePage}
            className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded-lg"
          >
            {saving ? "Saving..." : "Save Page"}
          </button>
        </div>
      </div>

      {/* PAGE SETTINGS */}
      <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-xl">Page Settings</h2>

        {/* TITLE */}
        <input
          placeholder="Page Title"
          value={title}
          onChange={(e) => {
            const val = e.target.value;
            setTitle(val);

            if (!slugManuallyEdited) {
              setSlugInput(slugify(val));
            }
          }}
          className="border p-2 rounded w-full"
        />

        {/* SLUG */}
        <input
          placeholder="Slug"
          value={slugInput}
          onChange={(e) => {
            setSlugInput(slugify(e.target.value));
            setSlugManuallyEdited(true);
          }}
          className="border p-2 rounded w-full"
        />

        {/* LEVEL */}
        <input
          type="number"
          min={0}
          placeholder="Level"
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="border p-2 rounded w-full"
        />
      </div>

      {/* TEMPLATE PICKER */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h2 className="font-bold mb-4 text-xl">Add Template Block</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.values(TEMPLATE_REGISTRY).map((tpl) => {
            const Preview = tpl.component;

            return (
              <div
                key={tpl.config.key}
                onClick={() => addBlock(tpl.config.key)}
                className="border rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition"
              >
                <div className="bg-gray-50 px-4 py-2 font-semibold text-sm">
                  {tpl.config.name}
                </div>

                <div className="p-3 h-[170px] overflow-hidden">
                  <div className="scale-[0.6] origin-top-left pointer-events-none">
                    <Preview title="Sample" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BLOCK EDITORS */}
      <div className="space-y-6">
        {blocks.map((block, index) => {
          const entry = TEMPLATE_REGISTRY[block.type];

          return (
            <div
              key={block.id}
              className="bg-white border rounded-xl p-5 shadow-sm"
            >
              <div className="flex justify-between mb-4">
                <div className="font-semibold">
                  {index + 1}. {entry.config.name}
                </div>

                <button
                  onClick={() => removeBlock(block.id)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </div>

              {entry.config.schema.map((field) => {
                const value = block.data[field.field] || "";

                if (field.type === "richtext")
                  return (
                    <RichTextInput
                      key={field.field}
                      value={value}
                      onChange={(v) => updateField(block.id, field.field, v)}
                    />
                  );

                return (
                  <input
                    key={field.field}
                    placeholder={field.label}
                    value={value}
                    onChange={(e) =>
                      updateField(block.id, field.field, e.target.value)
                    }
                    className="border p-2 rounded w-full mb-3"
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* PREVIEW */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="font-bold text-xl mb-5">Page Preview</h2>

        <div className="border rounded-lg p-6 bg-gray-50">
          {blocks.map((block) => {
            const Comp = TEMPLATE_REGISTRY[block.type].component;

            return <Comp key={block.id} {...block.data} />;
          })}
        </div>
      </div>
    </div>
  );
}
