import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/getServerUser";
import LogoutButton from "@/components/LogoutButton";

export default async function UserLayout({ children }) {
  const user = await getServerUser();

  if (!user) {
    redirect("/auth/user/login");
  }

  return (
    <div>
      <nav className="p-4 flex justify-between bg-blue-600 text-white">
        <h1 className="text-xl font-bold">User Dashboard</h1>
        <LogoutButton />
      </nav>

      <div className="p-6">{children}</div>
    </div>
  );
}
