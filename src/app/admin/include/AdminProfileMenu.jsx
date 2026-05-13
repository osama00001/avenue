"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminProfile } from "@/store/adminSlice";
import LogoutButton from "@/components/LogoutButton";
import { FaUserCircle, FaChevronDown } from "react-icons/fa";
import Link from "next/link";

export default function AdminProfileMenu() {
  const dispatch = useDispatch();
  const { email, role, name } = useSelector((s) => s.admin);

  const [open, setOpen] = useState(false);
  const ref = useRef();

  // Fetch profile once
  useEffect(() => {
    dispatch(fetchAdminProfile());
  }, [dispatch]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) {
        setOpen(false);
      }
    };

    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  return (
    <div ref={ref} className="cursor-pointer relative">
      {/* TRIGGER */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-gray-700 hover:text-black"
      >
        <FaUserCircle size={22} />
        <span className="font-medium hidden md:block">
          Account
        </span>
        <FaChevronDown
          size={12}
          className={`transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute right-0 mt-3 w-56 bg-white border rounded-lg shadow-lg overflow-hidden z-50">

          {/* HEADER */}
          <div className="px-4 py-3 border-b bg-gray-50">
            <div className="text-sm font-semibold">
              {email || "Admin"}
            </div>
            <div className="text-xs text-gray-500">
              {name}
            </div>
          </div>

          {/* MENU */}
          <div className="flex flex-col">

            <Link
              href="/admin/profile"
              className="px-4 py-3 hover:bg-gray-100 text-sm"
            >
              Profile
            </Link>

            {/* <Link
              href="/admin/settings"
              className="px-4 py-3 hover:bg-gray-100 text-sm"
            >
              Settings
            </Link> */}

            <div className="border-t">
              <LogoutButton className="w-full text-left px-4 py-3  text-sm" />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
