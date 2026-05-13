import { redirect } from "next/navigation";
import { getServerAdmin } from "@/lib/getServerUser";
import Header from "./include/Header";
import Sidebar from "./include/Sidebar";

export default async function AdminLayout({ children }) {
  const admin = await getServerAdmin();

  if (!admin) {
    redirect("/auth/admin/login");
  }

  return (
    <div className="flex min-h-screen">

      <Sidebar />

      <div className="flex-1 bg-gray-50 min-h-screen">

        <Header />

        <main className="">
          {children}
        </main>

      </div>
    </div>
  );
}


