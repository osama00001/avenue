"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchSocialLinks,
  updateSocialLinks,
} from "@/store/socialSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ToggleSwitch from "@/components/custom/ToggleSwitch";

/**
 * =========================
 * SETTINGS PAGE
 * =========================
 */
export default function SettingPage() {
  const dispatch = useDispatch();
  const { links, loading, saving } = useSelector((s) => s.social);

  const [localLinks, setLocalLinks] = useState([]);

  /**
   * LOAD DATA
   */
  useEffect(() => {
    dispatch(fetchSocialLinks());
  }, []);

  useEffect(() => {
    setLocalLinks(links || []);
  }, [links]);

  /**
   * HANDLERS
   */
  const addLink = () => {
    setLocalLinks((prev) => [
      ...prev,
      {
        label: "",
        url: "",
        icon: "",
        enabled: true,
        order: prev.length,
      },
    ]);
  };

  const removeLink = (index) => {
    setLocalLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const updateField = (index, field, value) => {
    setLocalLinks((prev) =>
      prev.map((l, i) =>
        i === index ? { ...l, [field]: value } : l
      )
    );
  };

  const save = () => {
    dispatch(updateSocialLinks(localLinks));
  };

  if (loading)
    return <div className="p-10 text-gray-500">Loading settings...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold">
            Social Media
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage footer social links shown to users
          </p>
        </div>

        <Button
          onClick={addLink}
          className="bg-white border cursor-pointer  border-black text-black hover:bg-black hover:text-white"
        >
          + Add Link
        </Button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">

        <table className="w-full text-sm">

          {/* HEADER */}
          <thead className="bg-gray-50 border-b">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold">Label</th>
              <th className="px-4 py-3 font-semibold">URL</th>
              <th className="px-4 py-3 font-semibold">Icon</th>
              <th className="px-4 py-3 font-semibold w-[90px]">
                Order
              </th>
              <th className="px-4 py-3 font-semibold w-[100px]">
                Enabled
              </th>
              <th className="px-4 py-3 font-semibold w-[90px]">
                Action
              </th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {localLinks.map((link, i) => (
              <tr
                key={i}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="px-4 py-3">
                  <Input
                    value={link.label}
                    placeholder="Facebook"
                    onChange={(e) =>
                      updateField(i, "label", e.target.value)
                    }
                  />
                </td>

                <td className="px-4 py-3">
                  <Input
                    value={link.url}
                    placeholder="https://..."
                    onChange={(e) =>
                      updateField(i, "url", e.target.value)
                    }
                  />
                </td>

                <td className="px-4 py-3">
                  <Input
                    value={link.icon}
                    placeholder="faInstagram"
                    onChange={(e) =>
                      updateField(i, "icon", e.target.value)
                    }
                  />
                </td>

                <td className="px-4 py-3">
                  <Input
                    type="number"
                    value={link.order}
                    onChange={(e) =>
                      updateField(
                        i,
                        "order",
                        Number(e.target.value)
                      )
                    }
                  />
                </td>

                <td className="px-4 py-3">
                  <ToggleSwitch
                    checked={link.enabled}
                    onChange={(v) =>
                      updateField(i, "enabled", v)
                    }
                  />
                </td>

                <td className="px-4 py-3">
                  <button
                    onClick={() => removeLink(i)}
                    className="text-red-500 cursor-pointer font-medium hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* SAVE BAR */}
      <div className="flex justify-end">
        <Button
          onClick={save}
          disabled={saving}
          className="bg-[#FF6A00] cursor-pointer hover:bg-[#e25f06] text-white px-8"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

    </div>
  );
}
