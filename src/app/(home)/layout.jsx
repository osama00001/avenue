"use client";

import { Toaster } from "react-hot-toast";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function HomeLayout({ children }) {
  return (
    <div>
      <Header />
      <div className="">{children}</div>
      <Footer />
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: "14px",
          },
        }}
      />
    </div>
  );
}
