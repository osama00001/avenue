"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboard } from "@/store/adminDashboardSlice";

const StatCard = ({ title, value }) => (
  <div className="bg-white rounded-xl shadow p-6">
    <div className="text-sm text-gray-500">{title}</div>
    <div className="text-2xl font-semibold mt-1">{value}</div>
  </div>
);

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector((s) => s.dashboard);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, []);

  if (loading || !data) return <div className="p-10">Loading dashboard...</div>;

  return (
    <div className="p-8 space-y-8">
      {/* ================= KPIs ================= */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard title="Revenue" value={`£${data.totals.revenue}`} />
        <StatCard title="Orders" value={data.totals.orders} />
        <StatCard title="Users" value={data.totals.users} />
        <StatCard title="Books" value={data.totals.books} />
      </div>

      {/* ================= TODAY ================= */}
      <div className="grid grid-cols-2 gap-6">
        <StatCard title="Orders Today" value={data.today.orders} />
        <StatCard title="Revenue Today" value={`£${data.today.revenue}`} />
      </div>

      {/* ================= TOP BOOKS ================= */}
      {/* <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">Top Selling Books</h2>

        {data.topBooks.map((b, i) => (
          <div key={i} className="flex justify-between border-b py-2">
            <span>{b.title?.[0]?.text || "Book"}</span>
            <span>{b.qty}</span>
          </div>
        ))}
      </div> */}
    </div>
  );
}
