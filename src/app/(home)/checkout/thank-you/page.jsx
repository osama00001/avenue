"use client";
import { Suspense } from "react";
import ThankYouClient from "./ThankYouClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <ThankYouClient />
    </Suspense>
  );
}
