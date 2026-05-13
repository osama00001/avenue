"use client";

import { BookOpen, FolderPlus } from "lucide-react";

export default function EmptyState({
  icon: Icon = BookOpen,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center border rounded-xl py-16 bg-white shadow-sm">
      <Icon size={48} className="text-gray-400 mb-4" />

      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>

      <p className="text-sm text-gray-500 mt-1 mb-4">{description}</p>

      {actionLabel && (
        <button
          onClick={onAction}
          className="bg-[#FF6A00] hover:bg-[#e55e00] cursor-pointer text-white px-4 py-2 rounded-md transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
