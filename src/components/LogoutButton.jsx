"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function LogoutButton({ className }) {
  const { data: session } = useSession();

  // Default callback
  let callbackUrl = "/";

  if (session?.user?.role === "admin") {
    callbackUrl = "/auth/admin/login";
  } else if (session?.user) {
    callbackUrl = "/auth/user/login";
  }

  return (
    <Button
      variant="destructive"
      className={`flex items-center justify-center cursor-pointer w-full px-4 py-3 text-sm ${className}`}
      onClick={() => signOut({ callbackUrl })}
    >
      Logout
    </Button>
  );
}
