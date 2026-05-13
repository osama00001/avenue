"use client";
import BookForm from "@/components/BookForm";
import { useRouter } from "next/navigation";

export default function AddBookPage() {
  const router = useRouter();

  return (
    <div className="p-6">
      <BookForm onSubmitSuccess={() => router.push("/admin")} />
    </div>
  );
}
