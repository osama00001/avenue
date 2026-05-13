import { logoutUser, resetUser } from "@/store/userSlice";
import Link from "next/link";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import LogoutButton from "../LogoutButton";

import { LucideUser, LucidePackage, LucideLogOut } from "lucide-react";

const HeaderUser = ({ hoveredDropdown }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const handleLogOut = async () => {
    await dispatch(logoutUser());
    await dispatch(resetUser());
  };

  const fullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : "My Account";

  return (
    <div
      className={`
  absolute top-full right-0 mt-2
  w-64
  bg-white border border-slate-200
  rounded-xl shadow-2xl
  z-[9999]
  transition-all duration-200 origin-top
  ${
    hoveredDropdown === "account"
      ? "opacity-100 visible scale-y-100"
      : "opacity-0 invisible scale-y-95"
  }
`}
    >
      {/* ================= HEADER ================= */}
      <div className="px-4 py-4 border-b bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#FF6A00] text-white flex items-center justify-center font-semibold">
            {user?.firstName?.[0] || "U"}
          </div>

          {/* Info */}
          <div>
            <div className="font-semibold text-gray-800">{fullName}</div>
            <div className="text-xs text-gray-500">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* ================= MENU ================= */}
      <div className="py-2 text-sm">
        {/* Profile */}
        {/* <Link
          href="/account/profile"
          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition"
        >
          <LucideUser size={18} />
          Profile Settings
        </Link> */}

        {/* Orders */}
        <Link
          href="/account/orders"
          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition"
        >
          <LucidePackage size={18} />
          My Orders
        </Link>
      </div>

      {/* ================= LOGOUT ================= */}
      <div className="border-t p-2">
        {/* <button
          onClick={handleLogOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-red-50 text-red-600 transition"
        >
          <LucideLogOut size={18} />
          Logout
        </button> */}
        <LogoutButton/>
      </div>
    </div>
  );
};

export default HeaderUser;
