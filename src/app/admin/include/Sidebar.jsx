"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Home, FolderTree, User } from "lucide-react";
import { MdGroups2 } from "react-icons/md";
import { IoLibraryOutline } from "react-icons/io5";
import { BiGroup } from "react-icons/bi";
import { TbCategory } from "react-icons/tb";
import { TbShoppingCartCopy } from "react-icons/tb";
import { IoSettingsOutline } from "react-icons/io5";
import { MdLibraryBooks } from "react-icons/md";
import { TbLogs } from "react-icons/tb";
// You can replace these with FontAwesome if preferred

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) =>
    pathname === path
      ? "bg-[#FF6A00] text-white shadow-sm"
      : "text-gray-700 hover:bg-gray-200";

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: <Home size={20} /> },
    {
      name: "Category",
      path: "/admin/category",
      icon: <TbCategory size={20} />,
    },
    {
      name: "Products",
      path: "/admin/products",
      icon: <IoLibraryOutline size={20} />,
    },
    { name: "Users", path: "/admin/users", icon: <BiGroup size={20} /> },
    { name: "CMS", path: "/admin/cms", icon: <MdLibraryBooks size={20} /> },
    { name: "Blogs", path: "/admin/blog", icon: <TbLogs size={20} /> },
    {
      name: "Orders",
      path: "/admin/orders",
      icon: <TbShoppingCartCopy size={20} />,
    },
    { name: "Profile", path: "/admin/profile", icon: <User size={20} /> },
    { name: "Settings", path: "/admin/setting", icon: <IoSettingsOutline size={20} /> },
  ];

  return (
    <aside
      className={`bg-white border-r transition-all duration-300 
      ${collapsed ? "w-16" : "w-64"} flex flex-col`}
    >
      {/* Top Section: Toggle */}
      <div className="flex items-center justify-between p-2 h-14">
        {!collapsed && (
          <h2 className="text-lg font-semibold tracking-wide text-gray-800">
            Admin Panel
          </h2>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded hover:bg-gray-100"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col p-3 gap-2">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            href={item.path}
            className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 
            cursor-pointer ${isActive(item.path)}`}
          >
            {item.icon}

            {/* Hide text when collapsed */}
            {!collapsed && (
              <span className="text-sm font-medium">{item.name}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom Section (Optional space or buttons) */}
      <div className="mt-auto p-3">
        {!collapsed && (
          <p className="text-xs text-gray-500">© 2026 Admin Panel</p>
        )}
      </div>
    </aside>
  );
}
