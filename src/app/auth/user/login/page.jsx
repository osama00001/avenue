"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import UserLogin from "./UserLogin";
import NewCustomerCard from "./NewCustomerCard";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { fetchCart } from "@/store/cartSlice";

const LoginPage = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchingCart = async () => {
      dispatch(fetchCart());
    };
    fetchingCart();
  }, [dispatch]);

  return (
    <div>
      <Header />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-10">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
          {/* LOGIN CARD */}
          <div
            className="rounded-lg border border-[#FF6A00]/30 
  bg-gradient-to-b from-white via-[#FF6A00]/10 to-[#FF6A00]/20 
  p-8 h-full"
          >
            <UserLogin />
          </div>

          <div
            className="rounded-lg border border-[#FF6A00]/30 
  bg-gradient-to-b from-white via-[#FF6A00]/10 to-[#FF6A00]/20 
  p-8 h-full"
          >
            <NewCustomerCard />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LoginPage;
