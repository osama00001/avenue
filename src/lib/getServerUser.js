import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function getServerUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  return session.user;
}

export async function getServerAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "admin") {
    return null;
  }

  return session.user;
}
