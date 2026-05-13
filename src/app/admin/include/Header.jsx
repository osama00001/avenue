"use client";

import LogoutButton from "@/components/LogoutButton";
import AdminProfileMenu from "./AdminProfileMenu";

export default function Header() {
  return (
    <header className="w-full h-14 bg-white shadow px-6 flex items-center justify-end">
      <AdminProfileMenu />
    </header>
  );
}
