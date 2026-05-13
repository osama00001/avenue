"use client";

import { useSession } from "next-auth/react";

export function useClientUser() {
    const { data: session, status } = useSession();

    if (!session?.user) {
        return null;
    }

    return session?.user;

    //   return {
    //     user: session?.user || null,
    //     loading: status === "loading",
    //     authenticated: status === "authenticated",
    //   };
}

export function useClientAdmin() {
    const { data: session, status } = useSession();

    if (!session?.user || session.user.role !== "admin") {
        return null;
    }

    return session?.user;

    //   return {
    //     user: session?.user || null,
    //     loading: status === "loading",
    //     authenticated: status === "authenticated",
    //   };
}
