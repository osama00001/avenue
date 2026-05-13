"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

const AdminHeader = ({ title, rightSlot = null }) => {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between mb-6">
      {/* LEFT: Back button + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex cursor-pointer items-center gap-1 text-sm font-medium text-gray-700 hover:text-black transition"
        >
          <FiArrowLeft size={18} />
          Back
        </button>

        {title && (
          <h1 className="text-xl font-semibold text-gray-900">
            {title}
          </h1>
        )}
      </div>

      {/* RIGHT: optional actions (save, add, etc.) */}
      {rightSlot && <div>{rightSlot}</div>}
    </header>
  );
};

export default AdminHeader;
